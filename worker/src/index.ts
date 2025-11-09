/**
 * Cloudflare Worker Entry Point
 * 
 * This worker implements an MCP (Model Context Protocol) server for Monarch Money.
 * It uses Workers secrets for secure credential storage and API key authentication.
 * Uses actual GraphQL queries extracted from the monarchmoney Python library source code.
 */

import { MonarchMoneyClient } from "./monarch-client";
import { MCPServer } from "./mcp-server";

export interface Env {
  // Secrets (set via: wrangler secret put MONARCH_EMAIL)
  MONARCH_EMAIL: string;
  MONARCH_PASSWORD: string;
  MONARCH_MFA_CODE?: string; // Optional: 6-digit TOTP code (if not using secret key)
  MONARCH_MFA_SECRET_KEY?: string; // Optional: MFA secret key (recommended - generates codes automatically)
  MCP_API_KEY?: string; // Optional: Worker API key for client authentication (if not set, no validation)

  // Environment variables
  MONARCH_API_BASE: string;
  ALLOWED_ORIGIN?: string; // Optional: restrict CORS to specific origin
}


/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Validate client API key (if MCP_API_KEY is set)
 */
function validateApiKey(request: Request, env: Env): boolean {
  // If MCP_API_KEY is not set, allow all requests (no validation)
  if (!env.MCP_API_KEY) {
    return true;
  }

  // Extract API key from Authorization header
  const authHeader = request.headers.get("authorization") || 
                     request.headers.get("Authorization");
  
  if (!authHeader) {
    return false;
  }

  // Remove "Bearer " prefix if present
  const clientApiKey = authHeader.trim().replace(/^Bearer\s+/i, "");

  if (!clientApiKey) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  return constantTimeEqual(clientApiKey, env.MCP_API_KEY);
}

/**
 * Get CORS origin based on configuration
 */
function getCORSOrigin(request: Request, env: Env): string {
  // If ALLOWED_ORIGIN is set, only allow that origin
  if (env.ALLOWED_ORIGIN) {
    const origin = request.headers.get("Origin");
    if (origin === env.ALLOWED_ORIGIN) {
      return origin;
    }
    // If specific origin is set but request doesn't match, return empty (no CORS)
    return "";
  }
  // Default: allow all origins (less secure, but compatible)
  return "*";
}

/**
 * Handle CORS preflight requests
 */
function handleCORS(request: Request, env: Env): Response | null {
  if (request.method === "OPTIONS") {
    const origin = getCORSOrigin(request, env);
    const headers: Record<string, string> = {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, mcp-protocol-version",
      "Access-Control-Max-Age": "86400",
    };
    
    // Only set CORS origin if we have one
    if (origin) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers["Access-Control-Allow-Credentials"] = "true";
    }
    
    return new Response(null, {
      status: 204,
      headers,
    });
  }
  return null;
}

/**
 * Get common response headers with CORS
 */
function getResponseHeaders(request: Request, env: Env): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  const origin = getCORSOrigin(request, env);
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  
  return headers;
}

/**
 * Sanitize error messages for production
 */
function sanitizeError(error: any, isProduction: boolean = false): string {
  if (isProduction) {
    // In production, don't expose internal error details
    return "Internal server error";
  }
  // In development, show full error message
  return error?.message || "Unknown error";
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { method } = request;
    
    // Root endpoint (like Habitify pattern)
    if (url.pathname === "/" && method === "GET") {
      return new Response("Monarch Money MCP Server is live.", {
        headers: { "Content-Type": "text/plain" },
      });
    }
    
    // Determine if we're in production (based on environment or URL)
    const isProduction = !env.ALLOWED_ORIGIN || !request.url.includes("localhost");
    
    // Handle CORS
    const corsResponse = handleCORS(request, env);
    if (corsResponse) {
      return corsResponse;
    }

    // Validate API key (if MCP_API_KEY is set)
    if (!validateApiKey(request, env)) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: {
            code: 401,
            message: "Unauthorized: Invalid or missing API key",
          },
        }),
        {
          status: 401,
          headers: getResponseHeaders(request, env),
        }
      );
    }

    // Parse MCP request first (like Habitify pattern)
    let mcpRequest: any;
    try {
      mcpRequest = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32700,
            message: "Parse error: Invalid JSON",
          },
        }),
        {
          status: 400,
          headers: getResponseHeaders(request, env),
        }
      );
    }

    // Extract client API key from Authorization header (like Habitify pattern)
    // Note: We don't validate this - it's just for logging/tracking
    // The Worker uses stored Monarch Money credentials to authenticate with the API
    let clientApiKey = request.headers.get("authorization") || "";
    clientApiKey = clientApiKey.trim().replace(/^Bearer\s+/i, "");
    
    // Log the request (like Habitify does)
    console.log("POKE REQUEST:", JSON.stringify(mcpRequest));
    if (clientApiKey) {
      // Redact API key for security (only show first 4 and last 4 characters)
      const redactedKey = clientApiKey.length > 8 
        ? `${clientApiKey.substring(0, 4)}...${clientApiKey.substring(clientApiKey.length - 4)}`
        : "***REDACTED***";
      console.log("Using Client API Key:", redactedKey);
    }

    // Initialize Monarch Money client with stored credentials
    // Prefer MFA secret key over MFA code (secret key generates codes automatically)
    console.log("[AUTH] Initializing Monarch Money client...");
    console.log(`[AUTH] Email: ${env.MONARCH_EMAIL ? env.MONARCH_EMAIL.substring(0, 3) + "***" : "NOT SET"}`);
    console.log(`[AUTH] Password: ${env.MONARCH_PASSWORD ? "***SET***" : "NOT SET"}`);
    console.log(`[AUTH] MFA Secret Key: ${env.MONARCH_MFA_SECRET_KEY ? "***SET***" : "NOT SET"}`);
    console.log(`[AUTH] MFA Code: ${env.MONARCH_MFA_CODE ? "***SET***" : "NOT SET"}`);
    
    const client = new MonarchMoneyClient(
      env.MONARCH_API_BASE || "https://api.monarchmoney.com",
      env.MONARCH_EMAIL,
      env.MONARCH_PASSWORD,
      env.MONARCH_MFA_CODE, // Only used if MFA secret key is not provided
      env.MONARCH_MFA_SECRET_KEY // Preferred: generates TOTP codes automatically
    );

    // Create MCP server
    const mcpServer = new MCPServer(client);

    // Validate JSON-RPC format
    if (mcpRequest.jsonrpc !== "2.0" || !mcpRequest.method) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: mcpRequest.id || null,
          error: {
            code: -32600,
            message: "Invalid Request: jsonrpc must be '2.0' and method is required",
          },
        }),
        {
          status: 400,
          headers: getResponseHeaders(request, env),
        }
      );
    }

    // Handle MCP request
    try {
      console.log(`[MCP] Handling request: ${mcpRequest.method}`);
      const mcpResponse = await mcpServer.handleRequest(mcpRequest);
      console.log(`[MCP] Response generated, has result: ${!!mcpResponse.result}, has error: ${!!mcpResponse.error}`);

      return new Response(JSON.stringify(mcpResponse), {
        status: 200,
        headers: getResponseHeaders(request, env),
      });
    } catch (error: any) {
      // Log full error details for debugging
      console.error("[ERROR] MCP request failed:", error);
      console.error("[ERROR] Error stack:", error.stack);
      console.error("[ERROR] Error message:", error.message);
      
      // In development, show full error; in production, sanitize
      const errorMessage = isProduction 
        ? "Internal server error" 
        : error.message || "Unknown error";
      
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: mcpRequest?.id || null,
          error: {
            code: -32000,
            message: `Internal error: ${errorMessage}`,
            data: isProduction ? undefined : { stack: error.stack },
          },
        }),
        {
          status: 500,
          headers: getResponseHeaders(request, env),
        }
      );
    }
  },
};


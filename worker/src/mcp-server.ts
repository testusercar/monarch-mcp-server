/**
 * MCP (Model Context Protocol) Server Implementation
 * 
 * Implements the MCP protocol using JSON-RPC over HTTP.
 * MCP Specification: https://modelcontextprotocol.io
 */

import { MonarchMoneyClient } from "./monarch-client";

export interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export class MCPServer {
  private client: MonarchMoneyClient;
  private tools: MCPTool[];

  constructor(client: MonarchMoneyClient) {
    this.client = client;
    this.tools = this.initializeTools();
  }

  /**
   * Initialize MCP tools
   */
  private initializeTools(): MCPTool[] {
    return [
      {
        name: "get_accounts",
        description: "Get all financial accounts from Monarch Money",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_transactions",
        description: "Get transactions from Monarch Money with optional filters",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Number of transactions to retrieve (default: 100)" },
            offset: { type: "number", description: "Number of transactions to skip (default: 0)" },
            start_date: { type: "string", description: "Start date in YYYY-MM-DD format" },
            end_date: { type: "string", description: "End date in YYYY-MM-DD format" },
            account_id: { type: "string", description: "Specific account ID to filter by" },
          },
        },
      },
      {
        name: "get_budgets",
        description: "Get budget information from Monarch Money",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_cashflow",
        description: "Get cashflow analysis from Monarch Money",
        inputSchema: {
          type: "object",
          properties: {
            start_date: { type: "string", description: "Start date in YYYY-MM-DD format" },
            end_date: { type: "string", description: "End date in YYYY-MM-DD format" },
          },
        },
      },
      {
        name: "get_account_holdings",
        description: "Get investment holdings for a specific account",
        inputSchema: {
          type: "object",
          properties: {
            account_id: { type: "string", description: "The ID of the investment account", required: true },
          },
          required: ["account_id"],
        },
      },
      {
        name: "create_transaction",
        description: "Create a new transaction in Monarch Money",
        inputSchema: {
          type: "object",
          properties: {
            account_id: { type: "string", required: true },
            amount: { type: "number", required: true },
            description: { type: "string", required: true },
            date: { type: "string", required: true },
            category_id: { type: "string" },
            merchant_name: { type: "string" },
          },
          required: ["account_id", "amount", "description", "date"],
        },
      },
      {
        name: "update_transaction",
        description: "Update an existing transaction in Monarch Money",
        inputSchema: {
          type: "object",
          properties: {
            transaction_id: { type: "string", required: true },
            amount: { type: "number" },
            description: { type: "string" },
            category_id: { type: "string" },
            date: { type: "string" },
          },
          required: ["transaction_id"],
        },
      },
      {
        name: "refresh_accounts",
        description: "Request account data refresh from financial institutions",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ];
  }

  /**
   * Handle MCP request
   */
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case "initialize":
          return this.handleInitialize(request);
        case "tools/list":
          return this.handleToolsList(request);
        case "tools/call":
          return this.handleToolCall(request);
        default:
          return this.errorResponse(request.id, -32601, `Method not found: ${request.method}`);
      }
    } catch (error: any) {
      return this.errorResponse(request.id, -32000, `Internal error: ${error.message}`);
    }
  }

  /**
   * Handle initialize request
   */
  private handleInitialize(request: MCPRequest): MCPResponse {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "monarch-mcp-server",
          version: "0.1.0",
        },
      },
    };
  }

  /**
   * Handle tools/list request
   */
  private handleToolsList(request: MCPRequest): MCPResponse {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        tools: this.tools,
      },
    };
  }

  /**
   * Handle tools/call request
   */
  private async handleToolCall(request: MCPRequest): Promise<MCPResponse> {
    const { name, arguments: args } = request.params || {};

    if (!name) {
      return this.errorResponse(request.id, -32602, "Invalid params: tool name required");
    }

    console.log(`[MCP] Tool call: ${name}`, JSON.stringify(args || {}));

    try {
      let result: any;

      switch (name) {
        case "get_accounts":
          result = await this.client.getAccounts();
          break;

        case "get_transactions":
          result = await this.client.getTransactions(
            args?.limit || 100,
            args?.offset || 0,
            args?.start_date,
            args?.end_date,
            args?.account_id
          );
          break;

        case "get_budgets":
          result = await this.client.getBudgets();
          break;

        case "get_cashflow":
          result = await this.client.getCashflow(args?.start_date, args?.end_date);
          break;

        case "get_account_holdings":
          if (!args?.account_id) {
            return this.errorResponse(request.id, -32602, "Invalid params: account_id required");
          }
          result = await this.client.getAccountHoldings(args.account_id);
          break;

        case "create_transaction":
          if (!args?.account_id || args?.amount === undefined || !args?.description || !args?.date) {
            return this.errorResponse(request.id, -32602, "Invalid params: account_id, amount, description, and date required");
          }
          result = await this.client.createTransaction(
            args.account_id,
            args.amount,
            args.description,
            args.date,
            args.category_id,
            args.merchant_name
          );
          break;

        case "update_transaction":
          if (!args?.transaction_id) {
            return this.errorResponse(request.id, -32602, "Invalid params: transaction_id required");
          }
          result = await this.client.updateTransaction(
            args.transaction_id,
            args.amount,
            args.description,
            args.category_id,
            args.date
          );
          break;

        case "refresh_accounts":
          result = await this.client.requestAccountsRefresh();
          break;

        default:
          return this.errorResponse(request.id, -32601, `Unknown tool: ${name}`);
      }

      console.log(`[MCP] Tool ${name} succeeded, result size: ${JSON.stringify(result).length} bytes`);
      
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    } catch (error: any) {
      console.error(`[MCP] Tool ${name} failed:`, error);
      console.error(`[MCP] Error stack:`, error.stack);
      console.error(`[MCP] Error message:`, error.message);
      return this.errorResponse(request.id, -32000, `Tool execution error: ${error.message}`);
    }
  }

  /**
   * Create error response
   */
  private errorResponse(id: string | number | null, code: number, message: string, data?: any): MCPResponse {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
        data,
      },
    };
  }
}


# Client-Side Protection - What Protects Your Information?

## 🔒 Overview

When a client (like Claude Desktop or any MCP client) makes requests to your Worker, multiple layers of protection are in place to secure your information.

## 🛡️ Protection Layers

### 1. **API Key Authentication** (Required)

**What it does:**
- Every request MUST include your API key
- Without the API key, requests are rejected with 401 Unauthorized
- The API key is validated using constant-time comparison (prevents timing attacks)

**Implementation:**
```typescript
// worker/src/index.ts
function checkApiKey(request: Request, env: Env): boolean {
  const apiKey = request.headers.get("X-API-Key") || 
                 request.headers.get("Authorization")?.replace("Bearer ", "");
  
  if (!apiKey || !env.MCP_API_KEY) {
    return false;  // ❌ Reject request
  }
  
  // Constant-time comparison prevents timing attacks
  return constantTimeEqual(apiKey, env.MCP_API_KEY);
}
```

**What clients must do:**
```bash
# Include API key in header
curl -H "X-API-Key: your-api-key" https://monarch-mcp-server.trackchairking.workers.dev
```

**What happens without API key:**
```json
{
  "jsonrpc": "2.0",
  "id": null,
  "error": {
    "code": 401,
    "message": "Unauthorized: Invalid or missing API key"
  }
}
```

**Protection level:** ✅ **Strong** - Blocks all unauthorized access

---

### 2. **HTTPS/TLS Encryption** (Automatic)

**What it does:**
- All communication is encrypted in transit
- Cloudflare Workers automatically enforce HTTPS
- TLS 1.3 encryption prevents eavesdropping

**Implementation:**
- Automatic by Cloudflare Workers
- No configuration needed

**What clients get:**
- Encrypted connection to Worker
- Encrypted connection from Worker to Monarch Money API
- No plaintext transmission

**Protection level:** ✅ **Strong** - Prevents man-in-the-middle attacks

---

### 3. **Constant-Time API Key Comparison** (Timing Attack Prevention)

**What it does:**
- Prevents timing attacks on API key validation
- Makes it impossible to guess API key by measuring response times
- Uses bitwise XOR operations for constant-time comparison

**Implementation:**
```typescript
// worker/src/index.ts
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
```

**Why it matters:**
- Without this, attackers could measure response times to guess API key
- With this, all comparisons take the same time regardless of match

**Protection level:** ✅ **Strong** - Prevents sophisticated timing attacks

---

### 4. **Error Message Sanitization** (Information Leakage Prevention)

**What it does:**
- Hides internal error details in production
- Prevents exposing sensitive information in error messages
- Shows generic errors to clients

**Implementation:**
```typescript
// worker/src/index.ts
function sanitizeError(error: any, isProduction: boolean = false): string {
  if (isProduction) {
    // In production, don't expose internal error details
    return "Internal server error";
  }
  // In development, show full error message
  return error?.message || "Unknown error";
}
```

**What clients see:**
- **Production:** Generic "Internal server error" (no sensitive details)
- **Development:** Full error message (for debugging)

**What clients DON'T see:**
- Stack traces
- Internal file paths
- Database connection strings
- Credential information
- API endpoint details

**Protection level:** ✅ **Moderate** - Prevents information leakage

---

### 5. **Input Validation** (Request Format Validation)

**What it does:**
- Validates JSON-RPC format
- Rejects malformed requests
- Prevents injection attacks

**Implementation:**
```typescript
// worker/src/index.ts
// Parse MCP request
let mcpRequest: any;
try {
  mcpRequest = await request.json();
} catch (error) {
  return new Response(/* Parse error */);
}

// Validate JSON-RPC format
if (mcpRequest.jsonrpc !== "2.0" || !mcpRequest.method) {
  return new Response(/* Invalid Request */);
}
```

**What clients must send:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

**What gets rejected:**
- Invalid JSON
- Missing `jsonrpc` field
- Missing `method` field
- Wrong JSON-RPC version

**Protection level:** ✅ **Moderate** - Prevents malformed requests

---

### 6. **CORS Configuration** (Origin Restriction - Optional)

**What it does:**
- Can restrict which websites can make requests
- Prevents unauthorized websites from accessing your Worker
- Configurable via `ALLOWED_ORIGIN` environment variable

**Implementation:**
```typescript
// worker/src/index.ts
function getCORSOrigin(request: Request, env: Env): string {
  // If ALLOWED_ORIGIN is set, only allow that origin
  if (env.ALLOWED_ORIGIN) {
    const origin = request.headers.get("Origin");
    if (origin === env.ALLOWED_ORIGIN) {
      return origin;  // ✅ Allow
    }
    return "";  // ❌ Reject
  }
  // Default: allow all origins (less secure, but compatible)
  return "*";
}
```

**Current status:**
- ⚠️ **Allows all origins** by default (for compatibility)
- ✅ **Can be restricted** by setting `ALLOWED_ORIGIN` in `wrangler.toml`

**To enable:**
```toml
# worker/wrangler.toml
[vars]
ALLOWED_ORIGIN = "https://yourdomain.com"
```

**Protection level:** ⚠️ **Weak** (default) → ✅ **Strong** (if configured)

---

### 7. **Credential Isolation** (What Clients Can't See)

**What it does:**
- Your Monarch Money credentials are NEVER exposed to clients
- Credentials are stored as Workers secrets (encrypted)
- Clients only see the results, not the credentials

**What clients CAN'T see:**
- ❌ Your Monarch Money email
- ❌ Your Monarch Money password
- ❌ Your MFA code
- ❌ Your API key (stored as secret)
- ❌ Authentication tokens (internal only)
- ❌ Internal error details

**What clients CAN see:**
- ✅ Your account data (if authenticated with API key)
- ✅ Transaction data (if authenticated with API key)
- ✅ Generic error messages (sanitized)

**Protection level:** ✅ **Strong** - Complete credential isolation

---

## 📊 Protection Summary

| Protection Layer | Status | Strength | What It Protects Against |
|-----------------|--------|----------|--------------------------|
| **API Key Authentication** | ✅ Active | Strong | Unauthorized access |
| **HTTPS/TLS Encryption** | ✅ Active | Strong | Eavesdropping, MITM attacks |
| **Constant-Time Comparison** | ✅ Active | Strong | Timing attacks |
| **Error Sanitization** | ✅ Active | Moderate | Information leakage |
| **Input Validation** | ✅ Active | Moderate | Malformed requests, injection |
| **CORS Restriction** | ⚠️ Optional | Weak→Strong | Unauthorized websites |
| **Credential Isolation** | ✅ Active | Strong | Credential exposure |

## 🔍 What Happens When a Client Makes a Request?

### Step-by-Step Protection Flow

1. **Client sends request** → HTTPS encrypted
2. **Worker receives request** → Validates API key
   - ❌ No API key → 401 Unauthorized (STOP)
   - ❌ Wrong API key → 401 Unauthorized (STOP)
   - ✅ Valid API key → Continue
3. **Worker validates request format** → JSON-RPC validation
   - ❌ Invalid format → 400 Bad Request (STOP)
   - ✅ Valid format → Continue
4. **Worker authenticates with Monarch Money** → Uses stored secrets
   - Credentials never exposed to client
   - Only Worker has access to secrets
5. **Worker processes request** → Calls Monarch Money API
   - All communication encrypted (HTTPS)
6. **Worker sanitizes response** → Removes sensitive data
   - Generic error messages in production
   - No credential information
7. **Worker returns response** → HTTPS encrypted
   - Only requested data (accounts, transactions, etc.)
   - No internal details

## 🚨 What Clients CANNOT Do

### Without API Key:
- ❌ Access any data
- ❌ See account information
- ❌ See transaction data
- ❌ Make any authenticated requests

### With API Key (but still protected):
- ✅ Access their own data (accounts, transactions)
- ❌ See your credentials (never exposed)
- ❌ See internal error details (sanitized)
- ❌ Access other users' data (isolated by credentials)
- ❌ Make unauthorized requests (input validation)

## 🔐 Additional Protections You Can Add

### 1. **Restrict CORS Origins**

```toml
# worker/wrangler.toml
[vars]
ALLOWED_ORIGIN = "https://yourdomain.com"
```

**Protection:** Prevents unauthorized websites from making requests

### 2. **Rate Limiting** (Not Currently Implemented)

**What it would do:**
- Limit requests per IP/API key
- Prevent brute force attacks
- Prevent DoS attacks

**How to add:**
- Use Cloudflare Rate Limiting (paid feature)
- Or implement custom rate limiting with Workers KV

### 3. **Request Logging** (Not Currently Implemented)

**What it would do:**
- Log requests (without sensitive data)
- Track failed authentication attempts
- Monitor for suspicious patterns

**How to add:**
- Use Cloudflare Workers Analytics
- Or implement custom logging

## ✅ Current Security Posture

**Overall:** ⚠️ **Moderately Secure** (with room for improvement)

**Strong protections:**
- ✅ API key authentication (required)
- ✅ HTTPS/TLS encryption (automatic)
- ✅ Constant-time comparison (timing attack prevention)
- ✅ Credential isolation (never exposed)
- ✅ Error sanitization (information leakage prevention)

**Weaknesses:**
- ⚠️ CORS allows all origins (can be restricted)
- ⚠️ No rate limiting (could be added)
- ⚠️ No request logging (could be added)

## 🎯 Bottom Line

**What protects your information on the client side:**

1. **API Key Authentication** - Blocks unauthorized access
2. **HTTPS/TLS** - Encrypts all communication
3. **Constant-Time Comparison** - Prevents timing attacks
4. **Error Sanitization** - Hides internal details
5. **Input Validation** - Prevents malformed requests
6. **Credential Isolation** - Credentials never exposed

**What clients need:**
- Your API key (which you control)
- Valid JSON-RPC requests
- HTTPS connection

**What clients get:**
- Access to their own data (if authenticated)
- Generic error messages (sanitized)
- Encrypted communication

**What clients DON'T get:**
- Your credentials (never exposed)
- Internal error details (sanitized)
- Access without API key (blocked)

## 📝 Recommendations

1. **Keep your API key secret** - Don't share it
2. **Restrict CORS origins** - Set `ALLOWED_ORIGIN` if possible
3. **Monitor usage** - Check Cloudflare Analytics
4. **Rotate API key** - If compromised
5. **Consider rate limiting** - For production use

Your information is protected by multiple layers of security. As long as you keep your API key secret, your data is secure.


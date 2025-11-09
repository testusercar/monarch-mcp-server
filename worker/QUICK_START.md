# Quick Start Guide - Set Up Your MCP Server

## 🚀 Step-by-Step Setup

### Step 1: Generate a Strong API Key

**On Windows PowerShell:**
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

**Or use an online generator:**
- Visit: https://www.random.org/strings/
- Generate a 32+ character random string
- Save it securely! You'll need it to access your MCP server.

**Example output:**
```
xK9mP2qR7vT4wY8zA1bC3dE5fG6hI0jK2lM4nO6pQ8rS0tU=
```

**⚠️ IMPORTANT:** Save this API key securely! You'll need it to access your MCP server.

---

### Step 2: Set Up Workers Secrets

Navigate to the worker directory and set your secrets:

```bash
cd worker
```

#### 2.1: Set Monarch Money Email
```bash
npx wrangler secret put MONARCH_EMAIL
```
- When prompted, enter your Monarch Money email address
- Press Enter

#### 2.2: Set Monarch Money Password
```bash
npx wrangler secret put MONARCH_PASSWORD
```
- When prompted, enter your Monarch Money password
- Press Enter

#### 2.3: Set MFA Code (Optional - Only if you have 2FA enabled)
```bash
npx wrangler secret put MONARCH_MFA_CODE
```
- If you have MFA enabled, enter your MFA code
- If you don't have MFA, just press Enter (leave empty)

#### 2.4: Set Your API Key
```bash
npx wrangler secret put MCP_API_KEY
```
- When prompted, paste your generated API key from Step 1
- Press Enter

---

### Step 3: Verify Secrets Are Set

Check that all secrets are configured:

```bash
npx wrangler secret list
```

You should see:
- ✅ `MONARCH_EMAIL`
- ✅ `MONARCH_PASSWORD`
- ✅ `MONARCH_MFA_CODE` (if set)
- ✅ `MCP_API_KEY`

---

### Step 4: Test Your Worker

Test that everything works:

#### 4.1: Test Authentication

**On Windows PowerShell:**
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "X-API-Key" = "your-api-key-here"  # Replace with your actual API key
}

$body = @{
    jsonrpc = "2.0"
    id = 1
    method = "initialize"
    params = @{
        protocolVersion = "2024-11-05"
        capabilities = @{}
        clientInfo = @{
            name = "test-client"
            version = "1.0.0"
        }
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://monarch-mcp-server.trackchairking.workers.dev" -Method Post -Headers $headers -Body $body
```

**On macOS/Linux:**
```bash
curl -X POST https://monarch-mcp-server.trackchairking.workers.dev \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }'
```

**Expected response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "serverInfo": {
      "name": "Monarch Money MCP Server",
      "version": "1.0.0"
    }
  }
}
```

#### 4.2: Test Available Tools

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "X-API-Key" = "your-api-key-here"
}

$body = @{
    jsonrpc = "2.0"
    id = 2
    method = "tools/list"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://monarch-mcp-server.trackchairking.workers.dev" -Method Post -Headers $headers -Body $body
```

**Expected response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "get_accounts",
        "description": "Get all financial accounts from Monarch Money"
      },
      {
        "name": "get_transactions",
        "description": "Get transactions from Monarch Money with optional filters"
      }
      // ... more tools
    ]
  }
}
```

#### 4.3: Test Getting Accounts

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "X-API-Key" = "your-api-key-here"
}

$body = @{
    jsonrpc = "2.0"
    id = 3
    method = "tools/call"
    params = @{
        name = "get_accounts"
        arguments = @{}
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://monarch-mcp-server.trackchairking.workers.dev" -Method Post -Headers $headers -Body $body
```

**Expected response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[Your account data in JSON format]"
      }
    ]
  }
}
```

---

### Step 5: (Optional) Restrict CORS Origins

If you want to restrict which websites can make requests:

Edit `worker/wrangler.toml`:
```toml
[vars]
MONARCH_API_BASE = "https://api.monarchmoney.com"
ALLOWED_ORIGIN = "https://yourdomain.com"  # Your frontend domain
```

Then redeploy:
```bash
npm run deploy
```

---

## ✅ Setup Complete!

Your MCP server is now ready to use!

**Worker URL:** `https://monarch-mcp-server.trackchairking.workers.dev`

**API Key:** (Your generated key - keep it secret!)

---

## 🔧 Troubleshooting

### "401 Unauthorized" Error
- ✅ Check your API key is correct
- ✅ Verify secrets are set: `npx wrangler secret list`
- ✅ Make sure you're using the correct header: `X-API-Key`

### "Internal Server Error"
- ✅ Check Cloudflare Workers logs: `npx wrangler tail`
- ✅ Verify Monarch Money credentials are correct
- ✅ Check if MFA is required (set `MONARCH_MFA_CODE` secret)

### Authentication Issues
- ✅ Verify your Monarch Money email and password are correct
- ✅ If you have MFA enabled, make sure `MONARCH_MFA_CODE` is set
- ✅ Check that the Monarch Money API endpoint is correct

---

## 📝 Next Steps

1. **Save your API key securely** - You'll need it to access your MCP server
2. **Test all tools** - Make sure everything works
3. **Integrate with Claude Desktop** - Use your Worker URL and API key
4. **Monitor usage** - Check Cloudflare Analytics for unusual activity

---

## 🎉 You're All Set!

Your Monarch Money MCP server is now deployed and ready to use!


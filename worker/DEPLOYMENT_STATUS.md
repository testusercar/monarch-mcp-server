# Deployment Status

## ✅ Deployment Complete!

**Worker URL**: `https://monarch-mcp-server.trackchairking.workers.dev`

**Status**: Deployed but **secrets need to be configured** before it will work.

## 🔐 Required Secrets

The Worker needs these secrets to function:

1. **MONARCH_EMAIL** - Your Monarch Money email address
2. **MONARCH_PASSWORD** - Your Monarch Money password
3. **MCP_API_KEY** - Your private API key (generate a strong random key)
4. **MONARCH_MFA_CODE** (optional) - Only if you have MFA enabled

## 📋 Next Steps

### 1. Generate a Strong API Key

```bash
# On Windows PowerShell:
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Or use an online generator: https://www.random.org/strings/
# Generate a 32+ character random string
```

**Save this API key securely!** You'll need it to access your MCP server.

### 2. Set Workers Secrets

Run these commands in the `worker` directory:

```bash
cd worker

# Set Monarch Money credentials
npx wrangler secret put MONARCH_EMAIL
# Enter your Monarch Money email when prompted

npx wrangler secret put MONARCH_PASSWORD
# Enter your Monarch Money password when prompted

# Optional: If you have MFA enabled
npx wrangler secret put MONARCH_MFA_CODE
# Enter your MFA code when prompted (or leave empty)

# Set your private API key
npx wrangler secret put MCP_API_KEY
# Paste your generated API key when prompted
```

### 3. Verify Secrets Are Set

```bash
npx wrangler secret list
```

You should see all your secrets listed.

### 4. Test the Deployed Worker

Once secrets are set, test with:

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

Or test with PowerShell:

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "X-API-Key" = "your-api-key-here"
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

### 5. Test Available Tools

Once initialized, test the tools:

```bash
# List available tools
curl -X POST https://monarch-mcp-server.trackchairking.workers.dev \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list"
  }'

# Get accounts
curl -X POST https://monarch-mcp-server.trackchairking.workers.dev \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_accounts",
      "arguments": {}
    }
  }'
```

## 🔒 Security Notes

- **API Key**: Keep your API key secret! Anyone with it can access your Monarch Money data.
- **CORS**: By default, CORS allows all origins. To restrict it, set `ALLOWED_ORIGIN` in `wrangler.toml`.
- **Secrets**: All secrets are encrypted and never exposed in code or logs.

## 📝 Troubleshooting

### "Unauthorized" Error
- Check your API key is correct
- Verify secrets are set: `npx wrangler secret list`
- Make sure you're using the correct header: `X-API-Key` or `Authorization: Bearer ...`

### "Internal Server Error"
- Check Cloudflare Workers logs: `npx wrangler tail`
- Verify Monarch Money credentials are correct
- Check if MFA is required (set `MONARCH_MFA_CODE` secret)

### Authentication Issues
- Verify your Monarch Money email and password are correct
- If you have MFA enabled, make sure `MONARCH_MFA_CODE` is set
- Check that the Monarch Money API endpoint is correct

## 🎉 Success!

Once secrets are set and tested, your MCP server is ready to use!

You can now integrate it with Claude Desktop or any other MCP client.


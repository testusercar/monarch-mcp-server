# Setup Guide for Monarch Money MCP Worker

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Cloudflare account** (free tier works)
4. **Wrangler CLI** (installed via npm)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd worker
npm install
```

### 2. Login to Cloudflare

```bash
npx wrangler login
```

This will open a browser to authenticate with Cloudflare.

### 3. Set Up Workers Secrets

Set your Monarch Money credentials as **secrets** (encrypted, never exposed):

```bash
# Your Monarch Money email
npx wrangler secret put MONARCH_EMAIL
# Enter your email when prompted

# Your Monarch Money password
npx wrangler secret put MONARCH_PASSWORD
# Enter your password when prompted

# Optional: MFA secret key (recommended - generates codes automatically)
npx wrangler secret put MONARCH_MFA_SECRET_KEY
# Enter your MFA secret key when prompted
# To find your MFA secret key: Monarch Money Settings -> Security -> Enable MFA -> Copy "Two-factor text code"
# 
# OR use MFA code (6-digit TOTP code from authenticator app - less reliable)
npx wrangler secret put MONARCH_MFA_CODE
# Enter your 6-digit MFA code when prompted (leave empty if using secret key)
```

### 4. Configure CORS (Optional but Recommended)

For better security, restrict CORS to your specific origin:

Edit `wrangler.toml`:
```toml
[vars]
ALLOWED_ORIGIN = "https://yourdomain.com"  # Your frontend domain
```

Or set it as an environment variable:
```bash
# Set allowed origin (optional, but recommended for security)
npx wrangler secret put ALLOWED_ORIGIN
# Enter your origin: https://yourdomain.com
```

**Note**: If you don't set `ALLOWED_ORIGIN`, CORS will allow all origins (less secure, but compatible).

### 5. Generate and Set API Key

Generate a strong, random API key:

```bash
# On macOS/Linux:
openssl rand -hex 32

# On Windows (PowerShell):
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Or use an online generator: https://www.random.org/strings/
```

Set your API key as a secret:

```bash
npx wrangler secret put MCP_API_KEY
# Paste your generated API key when prompted
```

**Important**: Save this API key securely! You'll need it to access your MCP server.

### 5. Verify Secrets

Check that all secrets are set:

```bash
npx wrangler secret list
```

You should see:
- `MONARCH_EMAIL`
- `MONARCH_PASSWORD`
- `MONARCH_MFA_CODE` (if set)
- `MCP_API_KEY`

### 6. Deploy Your Worker

```bash
npm run deploy
```

Or:

```bash
npx wrangler deploy
```

After deployment, you'll get a URL like:
```
https://monarch-mcp-server.your-subdomain.workers.dev
```

### 7. Test Your Worker

Test the API key authentication:

```bash
# Test with your API key
curl -X POST https://monarch-mcp-server.your-subdomain.workers.dev \
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

If you get a 401 Unauthorized error, check:
1. Your API key is correct
2. The secret is set: `npx wrangler secret list`
3. You're using the correct header: `X-API-Key` or `Authorization: Bearer ...`

## Important Notes

### GraphQL API Schema

⚠️ **The GraphQL queries in `src/monarch-client.ts` are assumptions based on the Python library.**

The actual Monarch Money GraphQL API schema may differ. You may need to:

1. **Inspect the actual API**: Use browser dev tools when using Monarch Money web app
2. **Check network requests**: Look at the GraphQL queries being sent
3. **Adjust queries**: Update the queries in `src/monarch-client.ts` to match the actual API

### API Endpoint

The default API endpoint is `https://api.monarchmoney.com/graphql`. If this is incorrect:

1. Check the actual Monarch Money API endpoint
2. Update `MONARCH_API_BASE` in `wrangler.toml` or set it as an environment variable

### Authentication Flow

The worker uses:
1. Email/password authentication (with optional MFA code)
2. Stores the authentication token
3. Re-authenticates automatically if token expires

## Troubleshooting

### "Unauthorized" Errors

- Check your API key is correct
- Verify secrets are set: `npx wrangler secret list`
- Make sure you're including the API key in headers

### "Authentication failed" Errors

- Verify Monarch Money credentials are correct
- If you have MFA, make sure `MONARCH_MFA_CODE` is set
- Check that the API endpoint is correct

### GraphQL Errors

- The API schema may have changed
- Check the actual GraphQL queries in browser dev tools
- Update queries in `src/monarch-client.ts`

### Local Development

For local development with secrets:

```bash
npx wrangler dev --remote
```

This uses remote secrets from Cloudflare. For local secrets:

```bash
npx wrangler secret put MONARCH_EMAIL --local
npx wrangler secret put MONARCH_PASSWORD --local
npx wrangler secret put MCP_API_KEY --local
```

## Next Steps

1. **Test all tools**: Verify each MCP tool works correctly
2. **Monitor logs**: Check Cloudflare Workers dashboard for errors
3. **Update GraphQL queries**: Adjust based on actual API schema
4. **Configure MCP client**: Use your Worker URL and API key in your MCP client

## Security Best Practices

1. ✅ **Never commit secrets**: They're stored as Workers secrets
2. ✅ **Rotate API keys**: Regularly regenerate your `MCP_API_KEY`
3. ✅ **Monitor access**: Check Cloudflare Workers logs for unauthorized attempts
4. ✅ **Use strong API keys**: Generate random, long keys (32+ characters)
5. ✅ **HTTPS only**: All communication is encrypted via HTTPS


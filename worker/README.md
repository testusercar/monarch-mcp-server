# Monarch Money MCP Server - Cloudflare Worker

A Cloudflare Worker implementation of the Model Context Protocol (MCP) server for Monarch Money.

## Features

- ✅ **Client-Provided Credentials**: Clients provide their own Monarch Money credentials (like Habitify pattern)
- ✅ **Secure**: Credentials sent via HTTPS in Authorization header
- ✅ **MFA Support**: Supports both MFA code and MFA secret key (recommended)
- ✅ **CORS**: Configurable CORS origin restrictions
- ✅ **Fast**: Runs on Cloudflare's global edge network
- ✅ **MCP Compliant**: Full implementation of MCP protocol
- ✅ **Production-Ready**: Error sanitization and security best practices

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. (Optional) Set Up Fallback Credentials

**Note**: Clients should provide their own Monarch Money credentials in the Authorization header. These are optional fallback credentials:

```bash
# Optional: Fallback credentials (if client doesn't provide them)
wrangler secret put MONARCH_EMAIL
wrangler secret put MONARCH_PASSWORD
wrangler secret put MONARCH_MFA_SECRET_KEY  # Recommended: MFA secret key
```

**See `AUTHENTICATION.md` for details on client-provided credentials.**

### 3. Configure Environment Variables

Edit `wrangler.toml` to set the Monarch API base URL (if different from default):

```toml
[vars]
MONARCH_API_BASE = "https://api.monarchmoney.com"
```

### 4. Deploy

```bash
npm run deploy
```

Or deploy to a preview environment:

```bash
wrangler dev
```

## Usage

### API Key Authentication

All requests must include your API key in one of these ways:

1. **Header**: `X-API-Key: your-api-key`
2. **Authorization Header**: `Authorization: Bearer your-api-key`

### MCP Protocol

The server implements the MCP protocol over HTTP. Send JSON-RPC requests:

```bash
curl -X POST https://your-worker.your-subdomain.workers.dev \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

### Available Tools

- `get_accounts` - Get all financial accounts
- `get_transactions` - Get transactions with optional filters
- `get_budgets` - Get budget information
- `get_cashflow` - Get cashflow analysis
- `get_account_holdings` - Get investment holdings for an account
- `create_transaction` - Create a new transaction
- `update_transaction` - Update an existing transaction
- `refresh_accounts` - Request account data refresh

## Example Requests

### List Available Tools

```bash
curl -X POST https://your-worker.workers.dev \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

### Get Accounts

```bash
curl -X POST https://your-worker.workers.dev \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_accounts",
      "arguments": {}
    }
  }'
```

### Get Transactions

```bash
curl -X POST https://your-worker.workers.dev \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_transactions",
      "arguments": {
        "limit": 50,
        "start_date": "2024-01-01",
        "end_date": "2024-12-31"
      }
    }
  }'
```

## Security Notes

- ✅ **Secrets are secure**: Workers secrets are encrypted and never exposed in logs or code
- ✅ **API key protection**: Only requests with valid API key can access the server
- ✅ **HTTPS only**: All communication is encrypted via HTTPS
- ✅ **No credential exposure**: Monarch credentials are stored as secrets, never in code

## Development

### Local Development

```bash
npm run dev
```

This starts a local development server. You'll need to set secrets locally too:

```bash
wrangler dev --remote  # Use remote secrets from Cloudflare
```

Or set local secrets:

```bash
wrangler secret put MONARCH_EMAIL --local
wrangler secret put MONARCH_PASSWORD --local
wrangler secret put MCP_API_KEY --local
```

### Type Checking

```bash
npm run typecheck
```

## Troubleshooting

### Authentication Errors

If you get authentication errors:
1. Verify your API key is correct
2. Check that secrets are set: `wrangler secret list`
3. Verify Monarch Money credentials are correct

### MFA Required

If you have MFA enabled:
1. Set `MONARCH_MFA_CODE` secret with your MFA code
2. Note: MFA codes may expire, you may need to update them

### GraphQL Errors

If you see GraphQL errors:
1. The Monarch Money API may have changed
2. Check the GraphQL queries in `src/monarch-client.ts`
3. Verify the API base URL is correct

## License

MIT


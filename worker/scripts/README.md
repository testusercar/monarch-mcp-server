# API Schema Discovery Scripts

These scripts help you discover the actual Monarch Money API schema.

## Quick Start

### Option 1: Browser Inspection (Easiest)

1. Open Monarch Money web app
2. Open DevTools (F12)
3. Go to Network tab
4. Filter for "graphql"
5. Inspect requests to see actual queries

### Option 2: Use the Inspect Script

1. Get your authentication token from browser DevTools
2. Update `scripts/inspect-api.ts` with your token
3. Run: `npx tsx scripts/inspect-api.ts`

### Option 3: Check Source Code

1. Python library: https://github.com/hammem/monarchmoney
2. JavaScript library: https://github.com/pbassham/monarch-money-api

## What to Look For

### Authentication
- Login mutation structure
- Token format
- MFA flow

### Common Queries
- `accounts` - Get accounts
- `transactions` or `allTransactions` - Get transactions
- `budgets` - Get budgets
- `cashflow` - Get cashflow

### Response Structure
- Field names
- Data types
- Nested objects
- Error formats

## Updating the Worker

Once you find the actual schema:

1. Update `worker/src/monarch-client.ts` with correct queries
2. Update TypeScript types to match responses
3. Test each endpoint
4. Deploy and verify




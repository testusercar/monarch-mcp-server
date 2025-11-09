# Monarch Money API Schema Discovery

## 🎯 Goal

Find the actual Monarch Money GraphQL API schema to update the Cloudflare Worker implementation.

## 📚 Resources

### Official Sources
- **Monarch Money Status Page**: https://status.monarchmoney.com/public-api
- **API Endpoint**: Likely `https://api.monarchmoney.com/graphql` or `https://api.monarch.is/graphql`

### Unofficial Libraries (Source of Truth)

1. **Python Library** (Most Complete)
   - **GitHub**: https://github.com/hammem/monarchmoney
   - **PyPI**: https://pypi.org/project/monarchmoney/
   - **Why it's useful**: This is what your current Python MCP server uses
   - **What to look for**: GraphQL queries in the source code

2. **JavaScript/TypeScript Library**
   - **GitHub**: https://github.com/pbassham/monarch-money-api
   - **npm**: https://www.npmjs.com/package/monarchmoney
   - **Why it's useful**: TypeScript implementation may have types
   - **What to look for**: GraphQL queries and TypeScript types

## 🔍 Methods to Find the Schema

### Method 1: Check GitHub Source Code (Recommended)

#### Python Library Source
1. Go to: https://github.com/hammem/monarchmoney
2. Look for:
   - GraphQL query files
   - API client files
   - Files with `query` or `mutation` in the name
3. Extract the actual queries

#### JavaScript Library Source
1. Go to: https://github.com/pbassham/monarch-money-api
2. Look for:
   - GraphQL query definitions
   - TypeScript type definitions
   - API client implementation

### Method 2: Browser DevTools Inspection

1. **Open Monarch Money Web App**
   ```
   https://www.monarchmoney.com
   ```

2. **Log in to your account**

3. **Open Browser DevTools**
   - Press `F12` or `Ctrl+Shift+I` (Windows)
   - Press `Cmd+Option+I` (Mac)

4. **Go to Network Tab**

5. **Filter for GraphQL**
   - In the filter box, type: `graphql`
   - Or filter by: `graph`

6. **Interact with the App**
   - View accounts
   - View transactions
   - View budgets
   - Each action will trigger GraphQL requests

7. **Inspect Requests**
   - Click on a GraphQL request
   - Go to **Payload** or **Request** tab
   - You'll see the actual GraphQL query
   - Go to **Response** tab to see the response structure

### Method 3: Use GraphQL Introspection

Once you have a valid authentication token, try:

```bash
curl -X POST https://api.monarchmoney.com/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "query IntrospectionQuery { __schema { queryType { name fields { name description args { name type { name kind } } type { name kind } } } mutationType { name fields { name description args { name type { name kind } } type { name kind } } } } }"
  }'
```

Or use the script: `worker/scripts/inspect-api.ts`

### Method 4: Use a Proxy/Interceptor

1. **Set up a proxy**
   - Charles Proxy
   - mitmproxy
   - Burp Suite

2. **Intercept HTTPS traffic**
   - Configure your browser to use the proxy
   - Install the proxy's SSL certificate

3. **Capture GraphQL requests**
   - Interact with Monarch Money app
   - Capture all GraphQL requests and responses

4. **Analyze the queries**
   - Extract the actual GraphQL queries
   - Note the response structures

## 📋 What to Look For

### Authentication
- **Login mutation**: How to authenticate
- **Token format**: Bearer token? JWT?
- **MFA flow**: How 2FA is handled
- **Token refresh**: How to refresh expired tokens

### Common Queries

#### Accounts
- Query name: `accounts`, `getAccounts`, or similar
- Fields: `id`, `name`, `displayName`, `type`, `balance`, `institution`, `isActive`
- Response structure

#### Transactions
- Query name: `transactions`, `allTransactions`, or similar
- Filters: `limit`, `offset`, `startDate`, `endDate`, `accountId`
- Fields: `id`, `date`, `amount`, `description`, `category`, `account`, `merchant`, `isPending`
- Response structure

#### Budgets
- Query name: `budgets`, `getBudgets`, or similar
- Fields: `id`, `name`, `amount`, `spent`, `remaining`, `category`, `period`
- Response structure

#### Cashflow
- Query name: `cashflow`, `getCashflow`, or similar
- Filters: `startDate`, `endDate`
- Fields: `income`, `expenses`, `net`, `period`
- Response structure

#### Holdings
- Query name: `accountHoldings`, `holdings`, or similar
- Parameters: `accountId`
- Fields: `id`, `symbol`, `name`, `quantity`, `price`, `value`
- Response structure

### Mutations

#### Create Transaction
- Mutation name: `createTransaction` or similar
- Parameters: `accountId`, `amount`, `description`, `date`, `categoryId`, `merchantName`
- Response structure

#### Update Transaction
- Mutation name: `updateTransaction` or similar
- Parameters: `transactionId`, `amount`, `description`, `categoryId`, `date`
- Response structure

#### Refresh Accounts
- Mutation name: `refreshAccounts`, `requestAccountsRefresh`, or similar
- Parameters: None or account IDs
- Response structure

## 🔧 Next Steps

Once you find the actual schema:

1. **Update `worker/src/monarch-client.ts`**
   - Replace placeholder queries with actual queries
   - Update field names to match actual API
   - Fix any parameter names

2. **Update TypeScript Types**
   - Update interfaces in `worker/src/monarch-client.ts`
   - Match the actual response structures

3. **Test Each Endpoint**
   - Test authentication
   - Test each query
   - Test each mutation
   - Verify responses match expected structure

4. **Deploy and Verify**
   - Deploy the worker
   - Test with real API calls
   - Verify all tools work correctly

## 📝 Quick Reference

### API Endpoints (Likely)
- GraphQL: `https://api.monarchmoney.com/graphql`
- Alternative: `https://api.monarch.is/graphql`

### Authentication
- Likely uses Bearer token authentication
- Token obtained via login mutation
- May require email/password + MFA code

### GraphQL Format
```graphql
query GetAccounts {
  accounts {
    id
    name
    displayName
    type {
      name
    }
    currentBalance
    institution {
      name
    }
    isActive
  }
}
```

## 🚀 Quick Start

1. **Clone the Python library** to see actual queries:
   ```bash
   git clone https://github.com/hammem/monarchmoney.git
   cd monarchmoney
   # Look for GraphQL queries in the source
   ```

2. **Or clone the JavaScript library**:
   ```bash
   git clone https://github.com/pbassham/monarch-money-api.git
   cd monarch-money-api
   # Look for GraphQL queries
   ```

3. **Or use browser DevTools** (fastest):
   - Open Monarch Money web app
   - DevTools → Network → Filter "graphql"
   - Inspect requests

## ⚠️ Important Notes

- The API is **unofficial** and may change without notice
- Always test after extracting queries
- Response structures may vary
- Some fields may be optional
- Error handling may be different than expected




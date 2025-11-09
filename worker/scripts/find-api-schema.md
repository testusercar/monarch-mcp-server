# Finding Monarch Money API Schema

## Method 1: Inspect Browser Network Requests (Recommended)

1. **Open Monarch Money Web App**
   - Go to https://www.monarchmoney.com
   - Log in to your account

2. **Open Browser DevTools**
   - Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - Go to the **Network** tab

3. **Filter for GraphQL Requests**
   - In the filter box, type: `graphql` or `graph`
   - You should see requests to the GraphQL endpoint

4. **Inspect Requests**
   - Click on a request
   - Go to the **Payload** or **Request** tab
   - You'll see the actual GraphQL query/mutation
   - Go to the **Response** tab to see the response structure

5. **Common Endpoints to Look For**
   - `https://api.monarchmoney.com/graphql`
   - `https://api.monarch.is/graphql`
   - Any endpoint with `/graphql` in the path

## Method 2: Use GraphQL Introspection Query

Try running this introspection query to get the full schema:

```bash
curl -X POST https://api.monarchmoney.com/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "query IntrospectionQuery { __schema { types { name kind description fields { name description args { name type { name kind } } type { name kind } } } } }"
  }'
```

## Method 3: Check Python Library Source

The `monarchmoney` Python library source code contains the actual queries:

1. **GitHub Repository**: https://github.com/hammem/monarchmoney
2. **Look for GraphQL queries** in the source files
3. **Check the actual API calls** the library makes

## Method 4: Check JavaScript/TypeScript Implementation

There's a JavaScript implementation that might have the queries:

1. **GitHub Repository**: https://github.com/pbassham/monarch-money-api
2. **npm Package**: https://www.npmjs.com/package/monarchmoney
3. **Check the source code** for GraphQL queries

## Method 5: Use a Proxy/Interceptor

1. **Set up a proxy** (like Charles Proxy or mitmproxy)
2. **Intercept HTTPS traffic** from the Monarch Money app
3. **Capture GraphQL requests** and responses
4. **Analyze the actual queries** being sent

## Common GraphQL Operations to Look For

### Authentication
- Login mutation
- Token refresh
- MFA/2FA flow

### Accounts
- Query: `accounts` or `getAccounts`
- Fields: `id`, `name`, `displayName`, `type`, `balance`, `institution`

### Transactions
- Query: `transactions` or `allTransactions`
- Fields: `id`, `date`, `amount`, `description`, `category`, `account`, `merchant`
- Filters: `limit`, `offset`, `startDate`, `endDate`, `accountId`

### Budgets
- Query: `budgets` or `getBudgets`
- Fields: `id`, `name`, `amount`, `spent`, `remaining`, `category`, `period`

### Cashflow
- Query: `cashflow`
- Fields: `income`, `expenses`, `net`, `period`

## Next Steps

Once you find the actual schema:

1. **Update `worker/src/monarch-client.ts`** with the correct queries
2. **Test each endpoint** to verify it works
3. **Update the TypeScript types** to match the actual response structure




# Finding Monarch Money GraphQL Queries

## Quick Method: Check GitHub Source Code

The Python library your current server uses contains the actual GraphQL queries.

### Step 1: Clone the Repository

```bash
git clone https://github.com/hammem/monarchmoney.git
cd monarchmoney
```

### Step 2: Find GraphQL Queries

Look for files containing GraphQL queries:

```bash
# Search for GraphQL queries
grep -r "query\|mutation" . --include="*.py"

# Or search for specific terms
grep -r "get_accounts\|get_transactions\|get_budgets" . --include="*.py"
```

### Step 3: Examine Key Files

The main files to check are likely:
- `monarchmoney/client.py` - Main client implementation
- `monarchmoney/graphql/` - GraphQL queries (if exists)
- Any file with `query` or `graphql` in the name

### Step 4: Extract Queries

Once you find the queries, extract them and update:
- `worker/src/monarch-client.ts` - Replace placeholder queries with actual ones

## Alternative: Browser DevTools

1. Open https://www.monarchmoney.com
2. Log in to your account
3. Open DevTools (F12)
4. Go to Network tab
5. Filter for "graphql"
6. Interact with the app (view accounts, transactions, etc.)
7. Inspect each GraphQL request to see:
   - The actual query/mutation
   - Request variables
   - Response structure

## What to Look For

### Authentication
```graphql
mutation Login($email: String!, $password: String!, $mfaCode: String) {
  login(email: $email, password: $password, mfaCode: $mfaCode) {
    token
    user {
      id
      email
    }
  }
}
```

### Accounts Query
Look for query like:
```graphql
query {
  accounts {
    # fields here
  }
}
```

### Transactions Query
Look for query like:
```graphql
query GetTransactions($limit: Int, ...) {
  allTransactions(limit: $limit, ...) {
    # fields here
  }
}
```

## Update the Worker

Once you find the actual queries:

1. **Update `worker/src/monarch-client.ts`**
   - Replace the placeholder queries with actual ones
   - Update field names to match
   - Fix parameter names if different

2. **Update TypeScript Types**
   - Update interfaces to match actual response structures
   - Add any missing fields

3. **Test**
   - Deploy and test each endpoint
   - Verify responses match expected structure




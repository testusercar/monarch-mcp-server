# Monarch Money API Schema - Found!

## ✅ Successfully Extracted from Source Code

I've successfully cloned and examined the `monarchmoney` Python library repository and extracted the **actual GraphQL queries** used by Monarch Money's API.

## Key Findings

### API Endpoints
- **Base URL**: `https://api.monarchmoney.com`
- **Authentication**: REST API at `/auth/login/` (NOT GraphQL)
- **GraphQL Endpoint**: `https://api.monarchmoney.com/graphql`

### Authentication
- **Method**: REST POST to `/auth/login/`
- **Request Body**:
  ```json
  {
    "username": "email@example.com",
    "password": "password",
    "supports_mfa": true,
    "trusted_device": false,
    "totp": "mfa-code"  // Optional, only if MFA is enabled
  }
  ```
- **Response**: `{ "token": "..." }`
- **Authorization Header**: `Token {token}` (NOT Bearer!)

### GraphQL Queries Found

#### 1. Get Accounts
- **Query Name**: `GetAccounts`
- **Operation**: `GetAccounts`
- **Fragments**: `AccountFields`
- **Fields**: Full account details including balance, institution, type, etc.

#### 2. Get Transactions
- **Query Name**: `GetTransactionsList`
- **Operation**: `GetTransactionsList`
- **Variables**: `$offset`, `$limit`, `$filters: TransactionFilterInput`, `$orderBy`
- **Filters**: `startDate`, `endDate`, `accounts[]`, `categories[]`, `tags[]`, `search`, etc.
- **Fragments**: `TransactionOverviewFields`

#### 3. Get Budgets
- **Query Name**: `Common_GetJointPlanningData`
- **Operation**: `Common_GetJointPlanningData`
- **Variables**: `$startDate: Date!`, `$endDate: Date!`
- **Returns**: Complex budget data with monthly amounts, category groups, goals

#### 4. Get Cashflow
- **Query Name**: `Web_GetCashFlowPage`
- **Operation**: `Web_GetCashFlowPage`
- **Variables**: `$filters: TransactionFilterInput`
- **Returns**: Income, expenses, savings, savings rate

#### 5. Get Account Holdings
- **Query Name**: `Web_GetHoldings`
- **Operation**: `Web_GetHoldings`
- **Variables**: `$input: PortfolioInput`
- **Input**: `{ accountIds: [string], startDate: Date, endDate: Date, includeHiddenHoldings: boolean }`

#### 6. Create Transaction
- **Mutation Name**: `Common_CreateTransactionMutation`
- **Operation**: `Common_CreateTransactionMutation`
- **Input**: `CreateTransactionMutationInput`
- **Fields**: `date`, `accountId`, `amount`, `merchantName`, `categoryId`, `notes`, `shouldUpdateBalance`

#### 7. Update Transaction
- **Mutation Name**: `Web_TransactionDrawerUpdateTransaction`
- **Operation**: `Web_TransactionDrawerUpdateTransaction`
- **Input**: `UpdateTransactionMutationInput`
- **Fields**: `id`, `amount`, `date`, `category`, `name` (merchant), `hideFromReports`, `needsReview`, `goalId`, `notes`

#### 8. Refresh Accounts
- **Mutation Name**: `Common_ForceRefreshAccountsMutation`
- **Operation**: `Common_ForceRefreshAccountsMutation`
- **Input**: `ForceRefreshAccountsInput`
- **Fields**: `accountIds: [string]`

## Implementation Status

✅ **All queries have been extracted and implemented in `worker/src/monarch-client.ts`**

The Cloudflare Worker now uses the **actual GraphQL queries** from the Python library source code, ensuring compatibility with Monarch Money's API.

## Source Repository

- **Repository**: https://github.com/hammem/monarchmoney
- **File Examined**: `monarchmoney/monarchmoney.py`
- **Lines**: 1-2924 (full source code)

## Next Steps

1. ✅ **GraphQL queries extracted** - Done!
2. ✅ **Client implementation updated** - Done!
3. ⏳ **Test the Worker** - Deploy and test
4. ⏳ **Verify all endpoints work** - Test each tool

## Notes

- Authentication uses REST API, not GraphQL
- Authorization header format: `Token {token}` (not `Bearer {token}`)
- All GraphQL queries match the actual implementation
- Transaction filters use `TransactionFilterInput` type
- Budget queries use `Date!` type (required)
- Holdings query uses `PortfolioInput` type




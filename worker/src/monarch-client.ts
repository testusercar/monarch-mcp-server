/**
 * Monarch Money API Client
 * 
 * Based on the actual monarchmoney Python library source code.
 * API Endpoint: https://api.monarchmoney.com
 * Authentication: REST API at /auth/login/ (not GraphQL)
 * GraphQL Endpoint: https://api.monarchmoney.com/graphql
 */

export interface MonarchAuthResponse {
  token: string;
}

export interface MonarchAccount {
  id: string;
  displayName: string;
  syncDisabled?: boolean;
  deactivatedAt?: string;
  isHidden?: boolean;
  isAsset?: boolean;
  mask?: string;
  createdAt?: string;
  updatedAt?: string;
  displayLastUpdatedAt?: string;
  currentBalance?: number;
  displayBalance?: number;
  includeInNetWorth?: boolean;
  hideFromList?: boolean;
  hideTransactionsFromReports?: boolean;
  includeBalanceInNetWorth?: boolean;
  includeInGoalBalance?: boolean;
  dataProvider?: string;
  dataProviderAccountId?: string;
  isManual?: boolean;
  transactionsCount?: number;
  holdingsCount?: number;
  manualInvestmentsTrackingMethod?: string;
  order?: number;
  logoUrl?: string;
  type?: {
    name: string;
    display: string;
  };
  subtype?: {
    name: string;
    display: string;
  };
  institution?: {
    id: string;
    name: string;
    primaryColor?: string;
    url?: string;
  };
  credential?: {
    id: string;
    updateRequired?: boolean;
    disconnectedFromDataProviderAt?: string;
    dataProvider?: string;
    institution?: {
      id: string;
      plaidInstitutionId?: string;
      name: string;
      status?: string;
    };
  };
}

export interface MonarchTransaction {
  id: string;
  amount: number;
  pending: boolean;
  date: string;
  hideFromReports?: boolean;
  plaidName?: string;
  notes?: string;
  isRecurring?: boolean;
  reviewStatus?: string;
  needsReview?: boolean;
  attachments?: Array<{
    id: string;
    extension: string;
    filename: string;
    originalAssetUrl?: string;
    publicId?: string;
    sizeBytes?: number;
  }>;
  isSplitTransaction?: boolean;
  createdAt?: string;
  updatedAt?: string;
  category?: {
    id: string;
    name: string;
  };
  merchant?: {
    name: string;
    id: string;
    transactionsCount?: number;
  };
  account?: {
    id: string;
    displayName: string;
  };
  tags?: Array<{
    id: string;
    name: string;
    color?: string;
    order?: number;
  }>;
}

export interface MonarchBudget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  remaining: number;
  category?: {
    id: string;
    name: string;
  };
  categoryGroup?: {
    id: string;
    name: string;
  };
  period?: string;
}

export interface MonarchCashflow {
  sumIncome?: number;
  sumExpense?: number;
  savings?: number;
  savingsRate?: number;
}

export interface MonarchHolding {
  id: string;
  quantity?: number;
  basis?: number;
  totalValue?: number;
  securityPriceChangeDollars?: number;
  securityPriceChangePercent?: number;
  lastSyncedAt?: string;
  security?: {
    id: string;
    name: string;
    type?: string;
    ticker?: string;
    currentPrice?: number;
    currentPriceUpdatedAt?: string;
    closingPrice?: number;
    closingPriceUpdatedAt?: string;
    oneDayChangePercent?: number;
    oneDayChangeDollars?: number;
  };
  holdings?: Array<{
    id: string;
    type?: string;
    typeDisplay?: string;
    name?: string;
    ticker?: string;
    closingPrice?: number;
    isManual?: boolean;
    closingPriceUpdatedAt?: string;
  }>;
}

export class MonarchMoneyClient {
  private token: string | null = null;
  private apiBase: string;
  private email: string;
  private password: string;
  private mfaCode?: string;
  private mfaSecretKey?: string;

  constructor(
    apiBase: string,
    email: string,
    password: string,
    mfaCode?: string,
    mfaSecretKey?: string
  ) {
    this.apiBase = apiBase;
    this.email = email;
    this.password = password;
    this.mfaCode = mfaCode;
    this.mfaSecretKey = mfaSecretKey;
  }

  /**
   * Authenticate with Monarch Money API
   * Uses REST API at /auth/login/ (not GraphQL)
   * Returns authentication token
   * 
   * Supports two MFA methods:
   * 1. MFA Secret Key - generates TOTP codes automatically (recommended)
   * 2. MFA Code (TOTP) - 6-digit code from authenticator app
   */
  async login(): Promise<string> {
    try {
      console.log("[Monarch] Attempting login...");
      const loginData: any = {
        username: this.email,
        password: this.password,
        supports_mfa: true,
        trusted_device: false,
      };

      // If MFA secret key is provided, generate TOTP code from it
      if (this.mfaSecretKey) {
        console.log("[Monarch] Using MFA secret key to generate TOTP code");
        // Import TOTP library dynamically (Cloudflare Workers compatible)
        const { authenticator } = await import("otplib");
        const totp = authenticator.generate(this.mfaSecretKey);
        loginData.totp = totp;
      } else if (this.mfaCode) {
        console.log("[Monarch] Using provided MFA code");
        // If MFA code is provided directly, use it
        loginData.totp = this.mfaCode;
      } else {
        console.log("[Monarch] No MFA credentials provided");
      }

      console.log(`[Monarch] POST ${this.apiBase}/auth/login/`);
      const response = await fetch(`${this.apiBase}/auth/login/`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Client-Platform": "web",
          "User-Agent": "MonarchMoneyAPI",
        },
        body: JSON.stringify(loginData),
      });

      console.log(`[Monarch] Login response status: ${response.status}`);
      
      if (response.status === 403) {
        console.error("[Monarch] MFA required but not provided");
        throw new Error("MFA_REQUIRED");
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Monarch] Login failed: ${response.status} ${response.statusText} - ${errorText}`);
        throw new Error(`Login failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: MonarchAuthResponse = await response.json();

      if (!data.token) {
        console.error("[Monarch] Login response missing token");
        throw new Error("Invalid login response: no token received");
      }

      console.log("[Monarch] Login successful, token received");
      this.token = data.token;
      return this.token;
    } catch (error: any) {
      if (error.message === "MFA_REQUIRED") {
        throw error;
      }
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Ensure we have a valid token
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.token) {
      console.log("[Monarch] No token found, logging in...");
      await this.login();
    } else {
      console.log("[Monarch] Using existing token");
    }
  }

  /**
   * Execute a GraphQL query
   */
  private async graphqlQuery(query: string, variables?: any, operation?: string): Promise<any> {
    await this.ensureAuthenticated();

    const response = await fetch(`${this.apiBase}/graphql`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Client-Platform": "web",
        "Authorization": `Token ${this.token}`,
        "User-Agent": "MonarchMoneyAPI",
      },
      body: JSON.stringify({
        query,
        variables: variables || {},
        operationName: operation,
      }),
    });

    if (!response.ok) {
      // Token might be expired, try to re-authenticate once
      if (response.status === 401) {
        this.token = null;
        await this.ensureAuthenticated();
        // Retry once
        return this.graphqlQuery(query, variables, operation);
      }
      const errorText = await response.text();
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json() as { errors?: Array<{ message: string }>; data?: any };

    if (data.errors) {
      throw new Error(`GraphQL error: ${data.errors.map((e: any) => e.message).join(", ")}`);
    }

    return data.data;
  }

  /**
   * Get all accounts
   * Uses actual GraphQL query from monarchmoney library
   */
  async getAccounts(): Promise<{ accounts: MonarchAccount[]; householdPreferences?: any }> {
    const query = `
      query GetAccounts {
        accounts {
          ...AccountFields
          __typename
        }
        householdPreferences {
          id
          accountGroupOrder
          __typename
        }
      }

      fragment AccountFields on Account {
        id
        displayName
        syncDisabled
        deactivatedAt
        isHidden
        isAsset
        mask
        createdAt
        updatedAt
        displayLastUpdatedAt
        currentBalance
        displayBalance
        includeInNetWorth
        hideFromList
        hideTransactionsFromReports
        includeBalanceInNetWorth
        includeInGoalBalance
        dataProvider
        dataProviderAccountId
        isManual
        transactionsCount
        holdingsCount
        manualInvestmentsTrackingMethod
        order
        logoUrl
        type {
          name
          display
          __typename
        }
        subtype {
          name
          display
          __typename
        }
        credential {
          id
          updateRequired
          disconnectedFromDataProviderAt
          dataProvider
          institution {
            id
            plaidInstitutionId
            name
            status
            __typename
          }
          __typename
        }
        institution {
          id
          name
          primaryColor
          url
          __typename
        }
        __typename
      }
    `;

    return await this.graphqlQuery(query, undefined, "GetAccounts");
  }

  /**
   * Get transactions with optional filters
   * Uses actual GraphQL query from monarchmoney library
   */
  async getTransactions(
    limit: number = 100,
    offset: number = 0,
    startDate?: string,
    endDate?: string,
    accountId?: string
  ): Promise<{ allTransactions: { totalCount: number; results: MonarchTransaction[] }; transactionRules?: any[] }> {
    const query = `
      query GetTransactionsList($offset: Int, $limit: Int, $filters: TransactionFilterInput, $orderBy: TransactionOrdering) {
        allTransactions(filters: $filters) {
          totalCount
          results(offset: $offset, limit: $limit, orderBy: $orderBy) {
            id
            ...TransactionOverviewFields
            __typename
          }
          __typename
        }
        transactionRules {
          id
          __typename
        }
      }

      fragment TransactionOverviewFields on Transaction {
        id
        amount
        pending
        date
        hideFromReports
        plaidName
        notes
        isRecurring
        reviewStatus
        needsReview
        attachments {
          id
          extension
          filename
          originalAssetUrl
          publicId
          sizeBytes
          __typename
        }
        isSplitTransaction
        createdAt
        updatedAt
        category {
          id
          name
          __typename
        }
        merchant {
          name
          id
          transactionsCount
          __typename
        }
        account {
          id
          displayName
          __typename
        }
        tags {
          id
          name
          color
          order
          __typename
        }
        __typename
      }
    `;

    const filters: any = {
      search: "",
      categories: [],
      accounts: accountId ? [accountId] : [],
      tags: [],
    };

    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    } else if (startDate || endDate) {
      throw new Error("You must specify both startDate and endDate, not just one of them.");
    }

    const variables = {
      offset,
      limit,
      orderBy: "date",
      filters,
    };

    return await this.graphqlQuery(query, variables, "GetTransactionsList");
  }

  /**
   * Get budgets
   * Uses actual GraphQL query from monarchmoney library
   */
  async getBudgets(startDate?: string, endDate?: string): Promise<any> {
    // Get start/end dates (default to last month to next month)
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    
    const start = startDate || lastMonth.toISOString().split('T')[0];
    const end = endDate || nextMonth.toISOString().split('T')[0];

    const query = `
      query Common_GetJointPlanningData($startDate: Date!, $endDate: Date!) {
        budgetSystem
        budgetData(startMonth: $startDate, endMonth: $endDate) {
          ...BudgetDataFields
          __typename
        }
        categoryGroups {
          ...BudgetCategoryGroupFields
          __typename
        }
        goalsV2 {
          ...BudgetDataGoalsV2Fields
          __typename
        }
      }

      fragment BudgetDataMonthlyAmountsFields on BudgetMonthlyAmounts {
        month
        plannedCashFlowAmount
        plannedSetAsideAmount
        actualAmount
        remainingAmount
        previousMonthRolloverAmount
        rolloverType
        cumulativeActualAmount
        rolloverTargetAmount
        __typename
      }

      fragment BudgetMonthlyAmountsByCategoryFields on BudgetCategoryMonthlyAmounts {
        category {
          id
          __typename
        }
        monthlyAmounts {
          ...BudgetDataMonthlyAmountsFields
          __typename
        }
        __typename
      }

      fragment BudgetMonthlyAmountsByCategoryGroupFields on BudgetCategoryGroupMonthlyAmounts {
        categoryGroup {
          id
          __typename
        }
        monthlyAmounts {
          ...BudgetDataMonthlyAmountsFields
          __typename
        }
        __typename
      }

      fragment BudgetMonthlyAmountsForFlexExpenseFields on BudgetFlexMonthlyAmounts {
        budgetVariability
        monthlyAmounts {
          ...BudgetDataMonthlyAmountsFields
          __typename
        }
        __typename
      }

      fragment BudgetDataTotalsByMonthFields on BudgetTotals {
        actualAmount
        plannedAmount
        previousMonthRolloverAmount
        remainingAmount
        __typename
      }

      fragment BudgetTotalsByMonthFields on BudgetMonthTotals {
        month
        totalIncome {
          ...BudgetDataTotalsByMonthFields
          __typename
        }
        totalExpenses {
          ...BudgetDataTotalsByMonthFields
          __typename
        }
        totalFixedExpenses {
          ...BudgetDataTotalsByMonthFields
          __typename
        }
        totalNonMonthlyExpenses {
          ...BudgetDataTotalsByMonthFields
          __typename
        }
        totalFlexibleExpenses {
          ...BudgetDataTotalsByMonthFields
          __typename
        }
        __typename
      }

      fragment BudgetRolloverPeriodFields on BudgetRolloverPeriod {
        id
        startMonth
        endMonth
        startingBalance
        targetAmount
        frequency
        type
        __typename
      }

      fragment BudgetCategoryFields on Category {
        id
        name
        icon
        order
        budgetVariability
        excludeFromBudget
        isSystemCategory
        updatedAt
        group {
          id
          type
          budgetVariability
          groupLevelBudgetingEnabled
          __typename
        }
        rolloverPeriod {
          ...BudgetRolloverPeriodFields
          __typename
        }
        __typename
      }

      fragment BudgetDataFields on BudgetData {
        monthlyAmountsByCategory {
          ...BudgetMonthlyAmountsByCategoryFields
          __typename
        }
        monthlyAmountsByCategoryGroup {
          ...BudgetMonthlyAmountsByCategoryGroupFields
          __typename
        }
        monthlyAmountsForFlexExpense {
          ...BudgetMonthlyAmountsForFlexExpenseFields
          __typename
        }
        totalsByMonth {
          ...BudgetTotalsByMonthFields
          __typename
        }
      }

      fragment BudgetCategoryGroupFields on CategoryGroup {
        id
        name
        budgetVariability
        categories {
          ...BudgetCategoryFields
          __typename
        }
        groupLevelBudgetingEnabled
        __typename
      }

      fragment BudgetDataGoalsV2Fields on GoalV2 {
        id
        name
        __typename
      }
    `;

    return await this.graphqlQuery(query, { startDate: start, endDate: end }, "Common_GetJointPlanningData");
  }

  /**
   * Get cashflow analysis
   * Uses actual GraphQL query from monarchmoney library
   */
  async getCashflow(startDate?: string, endDate?: string): Promise<any> {
    const query = `
      query Web_GetCashFlowPage($filters: TransactionFilterInput) {
        summary: aggregates(filters: $filters, fillEmptyValues: true) {
          summary {
            sumIncome
            sumExpense
            savings
            savingsRate
            __typename
          }
          __typename
        }
      }
    `;

    const filters: any = {
      search: "",
      categories: [],
      accounts: [],
      tags: [],
    };

    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    } else if (startDate || endDate) {
      throw new Error("You must specify both startDate and endDate, not just one of them.");
    }

    return await this.graphqlQuery(query, { filters }, "Web_GetCashFlowPage");
  }

  /**
   * Get account holdings (for investment accounts)
   * Uses actual GraphQL query from monarchmoney library
   */
  async getAccountHoldings(accountId: string): Promise<{ portfolio: { aggregateHoldings: { edges: Array<{ node: MonarchHolding }> } } }> {
    const query = `
      query Web_GetHoldings($input: PortfolioInput) {
        portfolio(input: $input) {
          aggregateHoldings {
            edges {
              node {
                id
                quantity
                basis
                totalValue
                securityPriceChangeDollars
                securityPriceChangePercent
                lastSyncedAt
                holdings {
                  id
                  type
                  typeDisplay
                  name
                  ticker
                  closingPrice
                  isManual
                  closingPriceUpdatedAt
                  __typename
                }
                security {
                  id
                  name
                  type
                  ticker
                  typeDisplay
                  currentPrice
                  currentPriceUpdatedAt
                  closingPrice
                  closingPriceUpdatedAt
                  oneDayChangePercent
                  oneDayChangeDollars
                  __typename
                }
                __typename
              }
              __typename
            }
            __typename
          }
          __typename
        }
      }
    `;

    const today = new Date().toISOString().split('T')[0];
    
    const variables = {
      input: {
        accountIds: [accountId],
        endDate: today,
        includeHiddenHoldings: true,
        startDate: today,
      },
    };

    return await this.graphqlQuery(query, variables, "Web_GetHoldings");
  }

  /**
   * Create a transaction
   * Uses actual GraphQL mutation from monarchmoney library
   */
  async createTransaction(
    accountId: string,
    amount: number,
    description: string,
    date: string,
    categoryId?: string,
    merchantName?: string
  ): Promise<any> {
    const mutation = `
      mutation Common_CreateTransactionMutation($input: CreateTransactionMutationInput!) {
        createTransaction(input: $input) {
          errors {
            ...PayloadErrorFields
            __typename
          }
          transaction {
            id
          }
          __typename
        }
      }

      fragment PayloadErrorFields on PayloadError {
        fieldErrors {
          field
          messages
          __typename
        }
        message
        code
        __typename
      }
    `;

    const input: any = {
      date,
      accountId,
      amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
      merchantName: merchantName || description,
      shouldUpdateBalance: false,
    };

    if (categoryId) {
      input.categoryId = categoryId;
    }

    const result = await this.graphqlQuery(mutation, { input }, "Common_CreateTransactionMutation");
    
    if (result.createTransaction.errors && result.createTransaction.errors.length > 0) {
      throw new Error(`Create transaction failed: ${JSON.stringify(result.createTransaction.errors)}`);
    }

    return result.createTransaction;
  }

  /**
   * Update a transaction
   * Uses actual GraphQL mutation from monarchmoney library
   */
  async updateTransaction(
    transactionId: string,
    amount?: number,
    description?: string,
    categoryId?: string,
    date?: string
  ): Promise<any> {
    const mutation = `
      mutation Web_TransactionDrawerUpdateTransaction($input: UpdateTransactionMutationInput!) {
        updateTransaction(input: $input) {
          transaction {
            id
            amount
            pending
            date
            hideFromReports
            needsReview
            reviewedAt
            reviewedByUser {
              id
              name
              __typename
            }
            plaidName
            notes
            isRecurring
            category {
              id
              __typename
            }
            goal {
              id
              __typename
            }
            merchant {
              id
              name
              __typename
            }
            __typename
          }
          errors {
            ...PayloadErrorFields
            __typename
          }
          __typename
        }
      }

      fragment PayloadErrorFields on PayloadError {
        fieldErrors {
          field
          messages
          __typename
        }
        message
        code
        __typename
      }
    `;

    const input: any = {
      id: transactionId,
    };

    if (categoryId) {
      input.category = categoryId;
    }
    if (description) {
      input.name = description;
    }
    if (amount !== undefined) {
      input.amount = amount;
    }
    if (date) {
      input.date = date;
    }

    const result = await this.graphqlQuery(mutation, { input }, "Web_TransactionDrawerUpdateTransaction");
    
    if (result.updateTransaction.errors && result.updateTransaction.errors.length > 0) {
      throw new Error(`Update transaction failed: ${JSON.stringify(result.updateTransaction.errors)}`);
    }

    return result.updateTransaction;
  }

  /**
   * Request account refresh
   * Uses actual GraphQL mutation from monarchmoney library
   */
  async requestAccountsRefresh(accountIds?: string[]): Promise<any> {
    const mutation = `
      mutation Common_ForceRefreshAccountsMutation($input: ForceRefreshAccountsInput!) {
        forceRefreshAccounts(input: $input) {
          success
          errors {
            ...PayloadErrorFields
            __typename
          }
          __typename
        }
      }

      fragment PayloadErrorFields on PayloadError {
        fieldErrors {
          field
          messages
          __typename
        }
        message
        code
        __typename
      }
    `;

    // If no account IDs provided, we'll need to get all accounts first
    // For now, require account IDs or use empty array for all accounts
    const accountIdList = accountIds || [];

    const variables = {
      input: {
        accountIds: accountIdList,
      },
    };

    const result = await this.graphqlQuery(mutation, variables, "Common_ForceRefreshAccountsMutation");
    
    if (!result.forceRefreshAccounts.success) {
      throw new Error(`Refresh accounts failed: ${JSON.stringify(result.forceRefreshAccounts.errors)}`);
    }

    return result.forceRefreshAccounts;
  }
}

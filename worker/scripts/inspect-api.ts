/**
 * Script to help inspect Monarch Money API
 * 
 * This script can be run locally to inspect the actual Monarch Money API.
 * You'll need to authenticate first to get a token.
 */

interface InspectOptions {
  apiBase?: string;
  token?: string;
  email?: string;
  password?: string;
}

/**
 * Run GraphQL introspection query to get full schema
 */
async function introspectSchema(apiBase: string, token: string) {
  const introspectionQuery = `
    query IntrospectionQuery {
      __schema {
        queryType {
          name
          fields {
            name
            description
            args {
              name
              type {
                name
                kind
              }
            }
            type {
              name
              kind
              ofType {
                name
                kind
              }
            }
          }
        }
        mutationType {
          name
          fields {
            name
            description
            args {
              name
              type {
                name
                kind
              }
            }
            type {
              name
              kind
            }
          }
        }
        types {
          name
          kind
          description
          fields {
            name
            description
            type {
              name
              kind
              ofType {
                name
                kind
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(`${apiBase}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: introspectionQuery,
    }),
  });

  if (!response.ok) {
    throw new Error(`Introspection failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors, null, 2)}`);
  }

  return data.data;
}

/**
 * Test a simple query to see the actual structure
 */
async function testQuery(apiBase: string, token: string, query: string, variables?: any) {
  const response = await fetch(`${apiBase}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      variables: variables || {},
    }),
  });

  if (!response.ok) {
    throw new Error(`Query failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    console.error("GraphQL errors:", data.errors);
  }

  return data;
}

/**
 * Main function to inspect the API
 */
async function inspectAPI(options: InspectOptions) {
  const apiBase = options.apiBase || "https://api.monarchmoney.com";
  
  if (!options.token) {
    console.error("❌ No token provided. Please authenticate first.");
    console.log("\nTo get a token:");
    console.log("1. Log in to Monarch Money web app");
    console.log("2. Open browser DevTools → Network tab");
    console.log("3. Find a GraphQL request");
    console.log("4. Copy the Authorization header token");
    return;
  }

  console.log("🔍 Inspecting Monarch Money API...\n");
  console.log(`API Base: ${apiBase}`);
  console.log(`Token: ${options.token.substring(0, 20)}...\n`);

  try {
    // Try introspection
    console.log("📋 Running introspection query...");
    const schema = await introspectSchema(apiBase, options.token);
    console.log("✅ Introspection successful!");
    console.log(JSON.stringify(schema, null, 2));
    
    // Test a simple query
    console.log("\n🧪 Testing accounts query...");
    const accountsQuery = `
      query {
        accounts {
          id
          name
          displayName
          type {
            name
          }
          currentBalance
        }
      }
    `;
    
    const accountsResult = await testQuery(apiBase, options.token, accountsQuery);
    console.log("✅ Accounts query result:");
    console.log(JSON.stringify(accountsResult, null, 2));
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.log("\n💡 Tips:");
    console.log("- Verify your token is valid");
    console.log("- Check the API base URL is correct");
    console.log("- Try inspecting network requests in browser DevTools");
  }
}

// Example usage (uncomment and fill in your credentials)
// inspectAPI({
//   apiBase: "https://api.monarchmoney.com",
//   token: "your-token-here"
// });




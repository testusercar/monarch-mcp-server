# Secrets vs Environment Variables - Security Difference

## ⚠️ Critical Security Warning

**DO NOT use environment variables for sensitive data like passwords or API keys!**

## 🔐 Two Ways to Store Configuration

### 1. **Workers Secrets** (✅ SECURE - What We're Using)

**How to set:**
```bash
npx wrangler secret put MONARCH_EMAIL
npx wrangler secret put MONARCH_PASSWORD
npx wrangler secret put MCP_API_KEY
```

**Security:**
- ✅ **Encrypted at rest** by Cloudflare
- ✅ **Never exposed** in code, logs, or environment variables
- ✅ **Not visible** in `wrangler.toml` or Worker code
- ✅ **Only accessible** within the Worker runtime
- ✅ **Cannot be read** by anyone, even with Worker code access

**Current Implementation:**
```typescript
// In worker/src/index.ts
export interface Env {
  // Secrets (set via: wrangler secret put MONARCH_EMAIL)
  MONARCH_EMAIL: string;        // ✅ SECRET - Encrypted
  MONARCH_PASSWORD: string;     // ✅ SECRET - Encrypted
  MCP_API_KEY: string;          // ✅ SECRET - Encrypted
}
```

### 2. **Environment Variables** (❌ INSECURE for Sensitive Data)

**How to set:**
```toml
# In wrangler.toml
[vars]
MONARCH_EMAIL = "your-email@example.com"      # ❌ INSECURE - Plaintext!
MONARCH_PASSWORD = "your-password"            # ❌ INSECURE - Plaintext!
MCP_API_KEY = "your-api-key"                  # ❌ INSECURE - Plaintext!
```

**Security:**
- ❌ **Stored in plaintext** in `wrangler.toml`
- ❌ **Bundled into Worker code** during deployment
- ❌ **Visible to anyone** who can read the Worker code
- ❌ **Exposed in logs** and error messages
- ❌ **Accessible via Cloudflare dashboard** (visible to account admins)
- ❌ **Can be extracted** from the Worker bundle

## 🚨 What Happens If You Use Environment Variables?

### Scenario: Using Environment Variables

If you put sensitive data in `wrangler.toml`:

```toml
# ❌ DON'T DO THIS!
[vars]
MONARCH_EMAIL = "your-email@example.com"
MONARCH_PASSWORD = "your-password"
MCP_API_KEY = "your-api-key"
```

**Then:**
1. ✅ Anyone with access to your `wrangler.toml` file can see your credentials
2. ✅ Anyone with access to your git repository can see your credentials (if committed)
3. ✅ Anyone who can read the Worker code can extract the values
4. ✅ Cloudflare dashboard shows these values in plaintext
5. ✅ These values are bundled into the Worker code (visible in source maps)

### Scenario: Using Secrets (Current Implementation)

If you use secrets:

```bash
npx wrangler secret put MONARCH_EMAIL
# Enter: your-email@example.com
```

**Then:**
1. ✅ Values are encrypted by Cloudflare
2. ✅ Not visible in `wrangler.toml` or Worker code
3. ✅ Not accessible via Cloudflare dashboard (only encrypted storage)
4. ✅ Cannot be extracted from Worker bundle
5. ✅ Only accessible within Worker runtime

## 📊 Comparison Table

| Feature | Secrets | Environment Variables |
|---------|---------|----------------------|
| **Encryption** | ✅ Encrypted at rest | ❌ Plaintext |
| **Visible in wrangler.toml** | ❌ No | ✅ Yes |
| **Visible in Worker code** | ❌ No | ✅ Yes |
| **Visible in Cloudflare dashboard** | ❌ No (encrypted) | ✅ Yes (plaintext) |
| **Can be extracted from bundle** | ❌ No | ✅ Yes |
| **Safe for passwords** | ✅ Yes | ❌ No |
| **Safe for API keys** | ✅ Yes | ❌ No |
| **Safe for non-sensitive config** | ✅ Yes | ✅ Yes |

## ✅ Current Implementation (Secure)

**What we're using:**
```typescript
// worker/src/index.ts
export interface Env {
  // Secrets (set via: wrangler secret put MONARCH_EMAIL)
  MONARCH_EMAIL: string;        // ✅ SECRET
  MONARCH_PASSWORD: string;     // ✅ SECRET
  MCP_API_KEY: string;         // ✅ SECRET
  
  // Environment variables (non-sensitive config)
  MONARCH_API_BASE: string;     // ✅ OK - Not sensitive
  ALLOWED_ORIGIN?: string;      // ✅ OK - Not sensitive
}
```

**In wrangler.toml:**
```toml
# ✅ Only non-sensitive config here
[vars]
MONARCH_API_BASE = "https://api.monarchmoney.com"  # ✅ OK - Public URL
# ALLOWED_ORIGIN = "https://yourdomain.com"        # ✅ OK - Public URL
```

**Secrets are set separately:**
```bash
npx wrangler secret put MONARCH_EMAIL      # ✅ Encrypted
npx wrangler secret put MONARCH_PASSWORD   # ✅ Encrypted
npx wrangler secret put MCP_API_KEY        # ✅ Encrypted
```

## 🔍 How to Verify

### Check What's Visible

1. **Check wrangler.toml:**
   ```bash
   cat worker/wrangler.toml
   ```
   - ✅ Should NOT contain passwords or API keys
   - ✅ Only non-sensitive config (URLs, etc.)

2. **Check Worker code:**
   ```bash
   cat worker/src/index.ts
   ```
   - ✅ Should NOT contain actual passwords or API keys
   - ✅ Only references to `env.MONARCH_EMAIL`, etc.

3. **Check secrets:**
   ```bash
   npx wrangler secret list
   ```
   - ✅ Should show your secrets (but not their values)

### Test Security

Try to extract values from the Worker:

```bash
# This should NOT reveal your secrets
curl https://monarch-mcp-server.trackchairking.workers.dev
# Returns: 401 Unauthorized (secrets are protected)
```

## ⚠️ What NOT to Do

### ❌ DON'T Do This:

```toml
# ❌ NEVER put sensitive data here!
[vars]
MONARCH_EMAIL = "your-email@example.com"
MONARCH_PASSWORD = "your-password"
MCP_API_KEY = "your-api-key"
```

**Why?**
- Anyone with access to `wrangler.toml` can see your credentials
- If you commit this to git, your credentials are exposed
- Cloudflare dashboard shows these in plaintext
- These values are bundled into the Worker code

### ✅ DO This Instead:

```bash
# ✅ Use secrets for sensitive data
npx wrangler secret put MONARCH_EMAIL
npx wrangler secret put MONARCH_PASSWORD
npx wrangler secret put MCP_API_KEY
```

**Why?**
- Encrypted by Cloudflare
- Never exposed in code or logs
- Only accessible within Worker runtime

## 🎯 Summary

**Question: "If I add secrets as environment variables, can they then access?"**

**Answer: YES!** ❌

If you put sensitive data in `wrangler.toml` as environment variables:
- ✅ Anyone with access to `wrangler.toml` can see it
- ✅ Anyone with access to your git repo can see it (if committed)
- ✅ Anyone who can read the Worker code can extract it
- ✅ Cloudflare dashboard shows it in plaintext

**Current Implementation:**
- ✅ Uses **Workers Secrets** (encrypted, secure)
- ✅ Environment variables only for non-sensitive config (URLs, etc.)
- ✅ Your credentials are protected

**Bottom Line:**
- **Secrets** = Secure ✅ (what we're using)
- **Environment Variables** = Insecure for sensitive data ❌

**Keep using secrets for passwords and API keys!**


# MFA Secret Key Setup

## ✅ MFA Secret Key Support Added!

The Worker now supports **MFA Secret Key** authentication, just like the [keithah/monarchmoney-ts-mcp](https://github.com/keithah/monarchmoney-ts-mcp) repository.

## 🔐 What Changed

### Before (MFA Code Only)
- Required 6-digit TOTP code from authenticator app
- Codes expire every 30 seconds
- Had to update code frequently

### Now (MFA Secret Key - Recommended)
- Uses MFA secret key to generate codes automatically
- No expiration issues
- More reliable authentication
- Matches the Python library implementation

## 📋 How to Set Up MFA Secret Key

### Step 1: Find Your MFA Secret Key

1. Log into Monarch Money
2. Go to **Settings** → **Security** → **Enable MFA**
3. When setting up MFA, look for **"Two-factor text code"**
4. Copy this secret key (it's a long string of letters/numbers)

**Important:** This is the secret key, NOT the 6-digit code from your authenticator app.

### Step 2: Set the Secret Key

```bash
cd worker
npx wrangler secret put MONARCH_MFA_SECRET_KEY
```

When prompted, paste your MFA secret key and press Enter.

### Step 3: Verify It's Set

```bash
npx wrangler secret list
```

You should see `MONARCH_MFA_SECRET_KEY` in the list.

### Step 4: Redeploy (if needed)

The Worker has already been redeployed with MFA secret key support, so you're all set!

## 🔄 How It Works

The Worker now:

1. **Checks for MFA Secret Key first** (preferred method)
   - If found, generates TOTP code automatically using `otplib`
   - Uses the generated code for authentication

2. **Falls back to MFA Code** (if secret key not provided)
   - Uses the 6-digit TOTP code directly
   - Less reliable (codes expire)

## 📊 Comparison

| Method | Reliability | Setup | Expiration |
|--------|------------|-------|------------|
| **MFA Secret Key** | ✅ High | One-time setup | ✅ Never expires |
| **MFA Code** | ⚠️ Medium | Must update frequently | ❌ Expires every 30s |

## 🎯 Recommendation

**Use MFA Secret Key** - It's more reliable and matches the Python library implementation.

## 🔍 Technical Details

The implementation matches the Python library's approach:

```python
# Python library (monarchmoney)
if mfa_secret_key:
    data["totp"] = oathtool.generate_otp(mfa_secret_key)
```

```typescript
// Our TypeScript implementation
if (this.mfaSecretKey) {
  const { authenticator } = await import("otplib");
  const totp = authenticator.generate(this.mfaSecretKey);
  loginData.totp = totp;
}
```

Both generate TOTP codes from the secret key automatically.

## ✅ Next Steps

1. **Set your MFA secret key:**
   ```bash
   npx wrangler secret put MONARCH_MFA_SECRET_KEY
   ```

2. **Test the Worker:**
   ```powershell
   $headers = @{
       "Content-Type" = "application/json"
       "X-API-Key" = "BQResNw7/EMNtcrU7uvE8NUt1FfEkSX/i0JS7vT9Jcg="
   }
   $body = @{
       jsonrpc = "2.0"
       id = 1
       method = "tools/call"
       params = @{
           name = "get_accounts"
           arguments = @{}
       }
   } | ConvertTo-Json -Depth 10
   
   Invoke-RestMethod -Uri "https://monarch-mcp-server.trackchairking.workers.dev" -Method Post -Headers $headers -Body $body
   ```

3. **You should now be able to authenticate successfully!**

## 🎉 Success!

Your Worker now supports MFA secret key authentication, matching the implementation in [keithah/monarchmoney-ts-mcp](https://github.com/keithah/monarchmoney-ts-mcp).


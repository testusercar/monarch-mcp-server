# Authentication - Client-Provided Credentials

## 🔐 Authentication Pattern (Like Habitify)

The Monarch Money MCP server now works like the Habitify worker - **clients provide their own Monarch Money credentials** instead of using stored secrets.

## 📋 How It Works

### 1. **Client Provides Credentials**

Clients send their Monarch Money credentials in the `Authorization` header:

```
Authorization: Bearer <base64-encoded-json>
```

The JSON contains:
```json
{
  "email": "your-email@example.com",
  "password": "your-password",
  "mfaCode": "123456",           // Optional: 6-digit TOTP code
  "mfaSecretKey": "JBSWY3DPEHPK3PXP"  // Optional: MFA secret key (recommended)
}
```

### 2. **Base64 Encode the JSON**

Encode the JSON string as base64:

```javascript
const credentials = {
  email: "your-email@example.com",
  password: "your-password",
  mfaSecretKey: "JBSWY3DPEHPK3PXP"  // Optional but recommended
};

const jsonString = JSON.stringify(credentials);
const base64Encoded = btoa(jsonString);  // Browser
// or Buffer.from(jsonString).toString('base64')  // Node.js
```

### 3. **Send in Authorization Header**

```
Authorization: Bearer <base64-encoded-json>
```

## 💻 Example Usage

### JavaScript/TypeScript

```javascript
const credentials = {
  email: "your-email@example.com",
  password: "your-password",
  mfaSecretKey: "JBSWY3DPEHPK3PXP"  // Optional but recommended
};

const authToken = btoa(JSON.stringify(credentials));

const response = await fetch("https://monarch-mcp-server.trackchairking.workers.dev", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${authToken}`
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "my-client",
        version: "1.0.0"
      }
    }
  })
});
```

### PowerShell

```powershell
$credentials = @{
    email = "your-email@example.com"
    password = "your-password"
    mfaSecretKey = "JBSWY3DPEHPK3PXP"  # Optional but recommended
} | ConvertTo-Json

$bytes = [System.Text.Encoding]::UTF8.GetBytes($credentials)
$base64 = [Convert]::ToBase64String($bytes)

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $base64"
}

$body = @{
    jsonrpc = "2.0"
    id = 1
    method = "initialize"
    params = @{
        protocolVersion = "2024-11-05"
        capabilities = @{}
        clientInfo = @{
            name = "my-client"
            version = "1.0.0"
        }
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://monarch-mcp-server.trackchairking.workers.dev" -Method Post -Headers $headers -Body $body
```

### Python

```python
import json
import base64
import requests

credentials = {
    "email": "your-email@example.com",
    "password": "your-password",
    "mfaSecretKey": "JBSWY3DPEHPK3PXP"  # Optional but recommended
}

json_string = json.dumps(credentials)
base64_encoded = base64.b64encode(json_string.encode()).decode()

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {base64_encoded}"
}

body = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {
            "name": "my-client",
            "version": "1.0.0"
        }
    }
}

response = requests.post(
    "https://monarch-mcp-server.trackchairking.workers.dev",
    headers=headers,
    json=body
)
```

## 🔄 Fallback to Environment Variables

If the client doesn't provide credentials in the Authorization header, the Worker will fall back to environment variables (for backward compatibility):

- `MONARCH_EMAIL`
- `MONARCH_PASSWORD`
- `MONARCH_MFA_CODE` (optional)
- `MONARCH_MFA_SECRET_KEY` (optional, recommended)

## 🔒 Security Notes

1. **HTTPS Only**: Always use HTTPS when sending credentials
2. **MFA Secret Key**: Use MFA secret key instead of MFA code (more reliable)
3. **Don't Log Credentials**: Never log or expose credentials in error messages
4. **Rotate Credentials**: Change your Monarch Money password if compromised

## 📊 Comparison with Habitify Pattern

| Feature | Habitify | Monarch Money |
|---------|----------|---------------|
| **Client Provides** | API Key | Email/Password/MFA |
| **Header Format** | `Authorization: Bearer <api-key>` | `Authorization: Bearer <base64-json>` |
| **Worker Storage** | None | Optional fallback |
| **Pattern** | Direct API key | Base64-encoded credentials |

## ✅ Benefits

1. **Multi-User Support**: Each client uses their own credentials
2. **No Worker Secrets**: No need to store credentials in Worker (optional fallback)
3. **Flexible**: Clients can provide credentials dynamically
4. **Matches Habitify Pattern**: Consistent with other MCP servers

## 🚨 Error Messages

If credentials are missing or invalid:

```json
{
  "jsonrpc": "2.0",
  "id": null,
  "error": {
    "code": 401,
    "message": "Missing Monarch Money credentials in Authorization header. Provide credentials as: Authorization: Bearer <base64-encoded-json> where JSON contains {email, password, mfaCode?, mfaSecretKey?}"
  }
}
```

## 📝 Next Steps

1. **Update your client code** to provide credentials in Authorization header
2. **Use MFA secret key** (recommended) instead of MFA code
3. **Test authentication** with the new pattern
4. **Remove Worker secrets** (optional) if you're using client-provided credentials


# Security Guide for Monarch Money MCP Server

## ⚠️ Important Security Considerations

### Render Free Plan - Public Services

**On Render's free plan, web services are PUBLICLY accessible.** This means:

- ✅ **Environment variables are SAFE** - They are stored securely and NOT exposed in logs or URLs
- ⚠️ **The service itself is PUBLIC** - Anyone with the URL can access your MCP server
- ⚠️ **Your Monarch Money account is accessible** - Anyone can use your deployed MCP server to access your financial data

### Security Options

#### Option 1: Render Private Services (Recommended for Production)
- **Cost**: Paid plan required (~$7/month minimum)
- **Security**: Service is NOT accessible from the public internet
- **Setup**: Enable "Private" option in Render dashboard
- **Best for**: Production deployments with sensitive data

#### Option 2: Cloudflare Access (Free Tier Available)
- **Cost**: Free tier available
- **Security**: Add authentication layer in front of your service
- **Setup**: 
  1. Deploy service on Render (free plan)
  2. Add Cloudflare Access in front of it
  3. Require authentication to access the service
- **Best for**: Free deployments with authentication

#### Option 3: Deploy Locally or on Private Server
- **Cost**: Free (if you have a server)
- **Security**: Complete control over access
- **Setup**: Deploy on your own infrastructure
- **Best for**: Development or personal use

#### Option 4: Use Alternative Platform
- Consider platforms like:
  - Railway (has private services on free tier)
  - Fly.io (has private networking)
  - Self-hosted solutions

### Current Deployment Status

This deployment uses **environment variables** for Monarch Money credentials:
- `MONARCH_EMAIL` - Your Monarch Money email
- `MONARCH_PASSWORD` - Your Monarch Money password  
- `MONARCH_MFA_CODE` - Optional MFA code (if required)

**These environment variables are NOT exposed**, but the service itself is accessible to anyone with the URL.

### Recommendations

1. **For Testing/Development**: Use Render free plan with understanding that service is public
2. **For Production**: Use Render Private Services or Cloudflare Access
3. **For Personal Use**: Deploy locally or on a private server

### Next Steps

If you want to secure your deployment:

1. **Upgrade to Render Private Services** (paid plan)
   - Go to Render dashboard → Your service → Settings
   - Enable "Private" option
   - Service will no longer be publicly accessible

2. **Add Cloudflare Access** (free tier)
   - Set up Cloudflare in front of your Render service
   - Configure access policies to require authentication
   - Only authenticated users can access your service

3. **Deploy Locally**
   - Run the server on your local machine or private network
   - Access it only from trusted devices

For more information, see:
- [Render Private Services](https://render.com/docs/private-services)
- [Cloudflare Access](https://www.cloudflare.com/products/zero-trust/access/)


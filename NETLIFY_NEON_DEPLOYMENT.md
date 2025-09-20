# 🚀 Netlify + Neon DB Deployment Guide

## Step 1: Set Up Neon Database

### 1.1 Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub (recommended) or email
3. Create a new project

### 1.2 Create Database
1. **Project Name**: `zen-world-db`
2. **Database Name**: `zenworld`
3. **Region**: Choose closest to your users (e.g., US East for global, EU for Europe)
4. Click "Create Project"

### 1.3 Get Connection String
1. In your Neon dashboard, go to "Connection Details"
2. Select "Connection string"
3. Copy the PostgreSQL connection string (looks like):
   ```
   postgresql://username:password@ep-xyz.us-east-1.aws.neon.tech/zenworld?sslmode=require
   ```
4. **Save this securely** - you'll need it for Netlify environment variables

## Step 2: Prepare for Netlify Deployment

### 2.1 Environment Variables for Netlify
You'll need these environment variables in Netlify:

```env
# Required
AI_API_KEY=your_google_ai_api_key_here
DATABASE_URL=your_neon_connection_string_here

# Optional
NODE_ENV=production
PING_MESSAGE=zen-world production ready
```

### 2.2 Build Settings
- **Build command**: `npm run build`
- **Publish directory**: `dist/spa`
- **Functions directory**: `netlify/functions`

## Step 3: Deploy to Netlify

### Option A: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Sign up/login with GitHub
   - Click "New site from Git"
   - Choose your GitHub repository
   - Configure build settings:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist/spa`

3. **Add Environment Variables**
   - In Netlify dashboard → Site settings → Environment variables
   - Add each variable:
     ```
     AI_API_KEY = your_google_ai_api_key
     DATABASE_URL = your_neon_connection_string
     NODE_ENV = production
     ```

4. **Deploy**
   - Click "Deploy site"
   - Netlify will automatically build and deploy

### Option B: Manual Deploy

1. **Build locally**
   ```bash
   npm run build
   ```

2. **Drag & Drop**
   - Zip the `dist/spa` folder
   - Drag to Netlify deploy area
   - Add environment variables in settings

## Step 4: Verify Deployment

### 4.1 Check Health Endpoint
```bash
curl https://your-site-name.netlify.app/.netlify/functions/api/health
```

Expected response:
```json
{
  "ok": true,
  "aiConfigured": true,
  "dbConfigured": true
}
```

### 4.2 Test Core Features
1. **Advisory Generation**: Try asking a farming question
2. **Image Upload**: Test crop image analysis
3. **Updates**: Check weather/market data loads
4. **Database**: Save and retrieve advisories
5. **Multilingual**: Switch languages and test functionality

## Step 5: Domain & SSL (Optional)

### 5.1 Custom Domain
1. In Netlify → Domain settings
2. Add custom domain
3. Configure DNS with your domain provider

### 5.2 SSL Certificate
- Automatically provided by Netlify
- No additional configuration needed

## Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Test build locally first
   npm run build
   
   # Check for TypeScript errors
   npm run typecheck
   ```

2. **Environment Variables Not Working**
   - Verify variables are set in Netlify dashboard
   - Check spelling and format
   - Redeploy after adding variables

3. **Database Connection Issues**
   - Verify Neon connection string format
   - Check IP restrictions in Neon dashboard
   - Ensure SSL mode is included in connection string

4. **Function Timeouts**
   - Netlify functions have 10s timeout limit
   - AI requests might need optimization
   - Consider implementing retry logic

### Performance Optimization

1. **Neon Connection Pooling**
   - Neon handles connection pooling automatically
   - No additional configuration needed

2. **CDN & Caching**
   - Netlify CDN is automatic
   - Static assets cached globally
   - API responses can be cached

3. **Cold Start Optimization**
   - Functions stay warm with regular traffic
   - Consider scheduled functions to keep warm

## Cost Estimation

### Neon DB (Free Tier)
- ✅ 0.5 GB storage
- ✅ 10 hours compute per month
- ✅ Perfect for development/small production

### Netlify (Free Tier)
- ✅ 100 GB bandwidth
- ✅ 125k function calls/month
- ✅ Automatic HTTPS & CDN

**Total Cost**: $0/month for moderate usage

## Scaling Considerations

### When to Upgrade Neon
- Storage > 0.5 GB
- Compute time > 10 hours/month
- Need for multiple databases
- **Pro Plan**: $19/month

### When to Upgrade Netlify
- Bandwidth > 100 GB/month
- Function calls > 125k/month
- Need for background functions
- **Pro Plan**: $19/month

## Security Checklist

- [ ] Environment variables properly configured
- [ ] Database credentials secure
- [ ] HTTPS enabled (automatic with Netlify)
- [ ] API rate limiting considered
- [ ] Input validation working
- [ ] Error messages don't expose sensitive data

---

🎉 **Your Krushi Sathi app is now live on Netlify with Neon DB!**

Share your live URL: `https://your-site-name.netlify.app`
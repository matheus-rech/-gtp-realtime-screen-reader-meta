# Quick Fix: Vercel Deployment Issue

## The Problem
You tried to deploy both frontend and backend to Vercel, but the backend is showing permanent errors because:
- Vercel only supports **serverless functions** (max 10-60 second execution)
- Your backend needs **persistent WebSocket connections**
- The frontend and backend can't communicate properly

## The Solution: Deploy Backend Separately

### Step 1: Choose a Backend Platform

#### Option A: Railway (Recommended - Easiest)
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy backend
cd apps/backend
railway up

# 4. Get your backend URL
railway domain
# Example: https://your-app.railway.app
```

#### Option B: Render (Free Tier Available)
1. Go to [render.com](https://render.com)
2. Connect your GitHub repo
3. Create new **Web Service** (not Static Site)
4. Settings:
   - Build: `cd apps/backend && npm install && npm run build`
   - Start: `cd apps/backend && npm run start`
5. Add env vars: `OPENAI_API_KEY`, `REDIS_URL`
6. Deploy
7. Copy URL: `https://your-app.onrender.com`

#### Option C: Fly.io (Global Edge)
```bash
# 1. Install Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Deploy
fly launch
fly secrets set OPENAI_API_KEY=sk-...

# 3. Get URL
fly open
# Example: https://your-app.fly.dev
```

### Step 2: Update Vercel Frontend

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add/Update:
   ```
   NEXT_PUBLIC_BACKEND_URL = https://your-backend.railway.app
   ```
   (Use your actual backend URL from Step 1)
4. Redeploy frontend:
   ```bash
   vercel --prod
   ```

### Step 3: Verify Connection

1. Open browser console on your Vercel frontend
2. Check for:
   - ✅ Successful `/api/session` POST request
   - ✅ WebSocket connection to `/visual` established
   - ✅ No CORS errors

## Quick Commands Reference

### Deploy Backend to Railway
```bash
cd apps/backend
railway up
railway domain  # Get URL for Vercel
```

### Update Vercel Frontend
```bash
# Set backend URL in Vercel dashboard, then:
vercel --prod
```

### Check Everything Works
```bash
# Backend health check
curl https://your-backend.railway.app/health

# Frontend check
open https://your-frontend.vercel.app
```

## GitHub Actions Setup (Automated Deployments)

### Required GitHub Secrets
```yaml
# For Vercel (Frontend)
VERCEL_TOKEN: xxx
VERCEL_ORG_ID: xxx
VERCEL_PROJECT_ID: xxx
BACKEND_URL: https://your-backend.railway.app

# For Railway (Backend)
RAILWAY_TOKEN: xxx
OPENAI_API_KEY: sk-xxx
```

### Deploy on Push
Commits to `main` will automatically:
1. Deploy backend to Railway
2. Deploy frontend to Vercel with correct backend URL

## Common Issues

### "Cannot connect to backend"
- Check `NEXT_PUBLIC_BACKEND_URL` is set correctly in Vercel
- Ensure backend is running (`/health` endpoint responds)
- Check browser console for CORS errors

### "WebSocket connection failed"
- Backend must be on Railway/Render/Fly (not Vercel)
- Check WebSocket URL uses `wss://` for HTTPS backends
- Verify firewall/proxy allows WebSocket connections

### "Session creation failed"
- Verify `OPENAI_API_KEY` is set on backend
- Check Redis connection if using Redis
- Look at backend logs for specific errors

## Need More Help?

1. Check full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Review environment variables: [.env.example](./.env.example)
3. Check GitHub Actions logs for deployment errors
4. Backend logs: `railway logs` or check platform dashboard
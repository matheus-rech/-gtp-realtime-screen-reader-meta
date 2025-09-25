# 🚀 Deploy Your App Now - Step by Step Guide

## Prerequisites Checklist
- ✅ Railway CLI installed
- ✅ Vercel CLI installed
- ✅ Backend builds successfully
- ⚠️ **You need**: OpenAI API Key

## Step 1: Deploy Backend to Railway

### Option A: Using Railway Web Interface (Easiest)

1. **Go to Railway**
   - Visit [railway.app](https://railway.app)
   - Sign up/Login with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository: `gtp-realtime-screen-reader-meta`

3. **Configure the Service**
   - Railway will auto-detect the monorepo
   - Set the root directory to: `apps/backend`
   - Railway will use the Dockerfile automatically

4. **Add Environment Variables**
   In Railway dashboard, go to Variables tab and add:
   ```
   OPENAI_API_KEY = sk-your-actual-key-here
   FRAME_RATE_LIMIT = 2
   MAX_SESSIONS = 100
   VISUAL_MAX_RESOLUTION = 1024
   ```

5. **Add Redis (Optional but Recommended)**
   - In Railway dashboard, click "New"
   - Select "Database" → "Add Redis"
   - It will auto-connect to your backend

6. **Generate Domain**
   - Go to Settings tab
   - Under "Networking", click "Generate Domain"
   - Copy the URL (e.g., `https://your-app.up.railway.app`)
   - **SAVE THIS URL - You need it for Vercel!**

### Option B: Using Railway CLI

```bash
# 1. Login to Railway
railway login

# 2. Link your project
railway link

# 3. Deploy the backend
cd apps/backend
railway up

# 4. Set environment variables
railway variables set OPENAI_API_KEY=sk-your-actual-key-here
railway variables set FRAME_RATE_LIMIT=2
railway variables set MAX_SESSIONS=100

# 5. Add Redis
railway add

# 6. Get your domain
railway domain
```

## Step 2: Deploy Frontend to Vercel

### Using Vercel Web Interface

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Root Directory: `apps/frontend`
   - Build Command: `cd ../.. && npm run build --workspace frontend`
   - Install Command: `cd ../.. && npm install`

3. **Add Environment Variable**
   - Key: `NEXT_PUBLIC_BACKEND_URL`
   - Value: Your Railway URL from Step 1 (e.g., `https://your-app.up.railway.app`)

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your frontend is now live!

### Using Vercel CLI

```bash
# 1. Navigate to frontend
cd apps/frontend

# 2. Deploy to Vercel
vercel

# 3. Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No (if first time)
# - What's your project name? realtime-assistant-frontend
# - In which directory is your code located? ./
# - Want to override settings? No

# 4. Set environment variable
vercel env add NEXT_PUBLIC_BACKEND_URL production
# Enter your Railway backend URL when prompted

# 5. Deploy to production
vercel --prod
```

## Step 3: Test Your Deployment

### 1. Check Backend Health
```bash
curl https://your-backend.up.railway.app/health
# Should return: {"status":"healthy"}
```

### 2. Test Frontend
- Open your Vercel URL in browser
- Open browser console (F12)
- Click connect button
- Check for:
  - ✅ No CORS errors
  - ✅ WebSocket connection established
  - ✅ Session created successfully

## Quick Troubleshooting

### "Cannot connect to backend"
```bash
# Check backend is running
curl https://your-backend.railway.app/health

# Verify environment variable in Vercel
vercel env ls production
```

### "CORS Error"
The backend already has CORS enabled for all origins. If you still get errors:
1. Check the backend URL doesn't have a trailing slash
2. Ensure you're using HTTPS (not HTTP) for production

### "WebSocket connection failed"
1. Make sure you're using the Railway URL (not Vercel)
2. Check Railway logs: `railway logs`

### "OpenAI API Error"
1. Verify your API key in Railway: `railway variables`
2. Check you have credits in your OpenAI account

## Local Testing (Before Deploying)

```bash
# Terminal 1: Start backend
cd apps/backend
npm run dev

# Terminal 2: Start frontend
cd apps/frontend
npm run dev

# Open http://localhost:3000
```

## Environment Variables Summary

### Backend (Railway)
```env
OPENAI_API_KEY=sk-your-key-here
REDIS_URL=(auto-provided by Railway)
FRAME_RATE_LIMIT=2
MAX_SESSIONS=100
VISUAL_MAX_RESOLUTION=1024
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend.up.railway.app
```

## Success Checklist

- [ ] Backend deployed to Railway
- [ ] Backend URL obtained
- [ ] Frontend deployed to Vercel
- [ ] Environment variable set in Vercel
- [ ] Health check passes
- [ ] WebSocket connects
- [ ] Can start a conversation

## Need Help?

1. **Railway Issues**: Check logs with `railway logs`
2. **Vercel Issues**: Check build logs in Vercel dashboard
3. **API Issues**: Verify OpenAI API key and credits
4. **Connection Issues**: Check browser console for errors

## Alternative Platforms

If Railway doesn't work for you:

### Render (Free Tier)
1. Create account at [render.com](https://render.com)
2. New Web Service → Connect GitHub
3. Use `render.yaml` file in repo
4. Add environment variables
5. Deploy

### Fly.io
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Run: `fly launch` in `apps/backend`
3. Use `fly.toml` configuration
4. Deploy: `fly deploy`

---

**Remember**: The key is keeping frontend on Vercel and backend on a platform that supports WebSockets (Railway/Render/Fly). Don't try to put both on Vercel!
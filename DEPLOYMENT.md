# Deployment Guide

This guide covers deploying the Realtime Multimodal Assistant to various platforms.

## Overview

The application consists of two main components that **MUST BE DEPLOYED SEPARATELY**:
- **Frontend**: Next.js 14 application (can deploy to Vercel, Netlify, or static hosting)
- **Backend**: Express.js server with persistent WebSocket support (requires traditional server hosting)

⚠️ **IMPORTANT**: The backend cannot run on serverless platforms (Vercel Functions, Netlify Functions) due to WebSocket requirements. You must deploy the backend to a platform that supports persistent connections.

## Prerequisites

- Node.js 18+ (recommended: 20.x)
- OpenAI API key
- Redis instance (optional, but recommended for production)
- Two separate hosting services (one for frontend, one for backend)

## Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

### Backend (.env)
```bash
OPENAI_API_KEY=your_openai_api_key_here
REDIS_URL=redis://localhost:6379
PORT=8080
FRAME_RATE_LIMIT=2
MAX_SESSIONS=100
VISUAL_MAX_RESOLUTION=1024
```

## Recommended Deployment Architecture

### Best Practice: Separate Frontend and Backend

The optimal deployment strategy separates the frontend and backend:

```
┌─────────────────┐         ┌──────────────────┐
│                 │         │                  │
│  Vercel/Netlify │ ──────> │ Railway/Render/  │
│   (Frontend)    │  HTTPS  │   Fly.io         │
│                 │ <────── │   (Backend)      │
└─────────────────┘   WSS   └──────────────────┘
        │                            │
        └──────────────────┬─────────┘
                          │
                    ┌──────────┐
                    │  Redis   │
                    │ (Session │
                    │  Store)  │
                    └──────────┘
```

### Recommended Platform Combinations

1. **Production Ready (Recommended)**
   - Frontend: Vercel
   - Backend: Railway or Fly.io
   - Redis: Platform-provided or Redis Cloud

2. **Budget-Friendly**
   - Frontend: Netlify (free tier)
   - Backend: Render (free tier with spin-down)
   - Redis: Render Redis (free 25MB)

3. **Enterprise/High Performance**
   - Frontend: Vercel Pro or AWS CloudFront
   - Backend: AWS ECS/Fargate or Google Cloud Run
   - Redis: AWS ElastiCache or Redis Enterprise

## Deployment Options

### 1. Docker Deployment (Full Stack - Single Server)

#### Full Stack with Docker Compose
```bash
# Clone the repository
git clone https://github.com/matheus-rech/gtp-realtime-screen-reader.git
cd gtp-realtime-screen-reader

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Start all services
docker-compose up -d
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Redis: localhost:6379
- Nginx: http://localhost:80 (or https://localhost:443 with SSL)

#### Individual Docker Images
```bash
# Build frontend
docker build -t gtp-frontend --target frontend .

# Build backend  
docker build -t gtp-backend --target backend .

# Run frontend
docker run -p 3000:3000 -e NEXT_PUBLIC_BACKEND_URL=http://localhost:8080 gtp-frontend

# Run backend
docker run -p 8080:8080 -e OPENAI_API_KEY=your_key gtp-backend
```

### 2. Vercel Deployment (Frontend Only)

Vercel is ideal for the frontend deployment with serverless functions.

#### Setup
1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend: `cd apps/frontend`
3. Deploy: `vercel --prod`

#### Configuration
The repository includes an optimized `vercel.json` configuration that:
- Uses monorepo-aware build commands
- Lets Vercel auto-detect Next.js framework settings
- Avoids output directory overrides for better compatibility
- Includes security headers

#### Environment Variables
Set in Vercel dashboard:
- `NEXT_PUBLIC_BACKEND_URL`: Your backend URL

#### GitHub Integration
The repository includes `.github/workflows/deploy-vercel.yml` for automatic deployments.

Required secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `BACKEND_URL`

### 3. Netlify Deployment (Frontend Only)

#### Manual Deployment
1. Build the frontend: `npm run build --workspace frontend`
2. Deploy the `apps/frontend/.next` folder to Netlify

#### GitHub Integration
The repository includes `.github/workflows/deploy-netlify.yml` for automatic deployments.

Required secrets:
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`
- `BACKEND_URL`

#### Configuration
The `netlify.toml` file handles redirects and headers automatically.

### 4. Traditional VPS Deployment

#### Prerequisites
- Ubuntu 20.04+ or similar
- Node.js 20.x
- PM2 process manager
- Nginx reverse proxy
- SSL certificate

#### Setup Steps
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone https://github.com/matheus-rech/gtp-realtime-screen-reader.git
cd gtp-realtime-screen-reader

# Install dependencies
npm install

# Set up environment
cp .env.example .env
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
# Edit these files with your values

# Build frontend
npm run build --workspace frontend

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
    
    location /visual {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

### 5. Railway Deployment (Backend)

Railway is excellent for the backend due to its WebSocket support and easy Redis integration.

#### Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init
```

#### Backend Deployment
```bash
# Link to the backend directory
cd apps/backend

# Deploy using the custom Dockerfile
railway up --dockerfile Dockerfile.railway

# Or use the railway.json configuration
railway up
```

#### Environment Variables
Set in Railway dashboard or CLI:
```bash
railway variables set OPENAI_API_KEY=sk-...
railway variables set REDIS_URL=${{Redis.REDIS_URL}}
railway variables set FRAME_RATE_LIMIT=2
railway variables set MAX_SESSIONS=100
```

#### Add Redis Service
```bash
# Add Redis to your Railway project
railway add redis
```

#### Get Deployment URL
```bash
railway domain
# Copy this URL for NEXT_PUBLIC_BACKEND_URL in your frontend
```

### 6. Render Deployment (Backend + Frontend)

Render supports both static sites and web services with WebSocket support.

#### Backend Deployment
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Use the following settings:
   ```yaml
   Build Command: cd apps/backend && npm install && npm run build
   Start Command: cd apps/backend && npm run start
   Environment: Node
   Plan: Standard (for WebSocket support)
   ```
4. Add environment variables in Render dashboard
5. Deploy

#### Frontend Static Site
1. Create a new Static Site on Render
2. Build settings:
   ```yaml
   Build Command: cd apps/frontend && npm install && npm run build && npm run export
   Publish Directory: apps/frontend/out
   ```
3. Add `NEXT_PUBLIC_BACKEND_URL` environment variable
4. Deploy

#### Using render.yaml
```bash
# Deploy all services at once
render up
```

### 7. Fly.io Deployment (Backend)

Fly.io provides excellent WebSocket support and global edge deployment.

#### Initial Setup
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Sign up/Login
fly auth login

# Create app
fly launch --no-deploy
```

#### Backend Deployment
```bash
# Deploy the backend
fly deploy --config fly.toml

# Set secrets
fly secrets set OPENAI_API_KEY=sk-...
fly secrets set REDIS_URL=redis://...

# Scale the app
fly scale count 2 --region iad,lhr

# Get the app URL
fly open
# Copy this URL for NEXT_PUBLIC_BACKEND_URL
```

#### Frontend Deployment (Optional)
```bash
# Use the frontend-specific config
fly deploy --config fly.frontend.toml --app your-frontend-app
```

#### Monitoring
```bash
# Check app status
fly status

# View logs
fly logs

# SSH into the container
fly ssh console
```

### 8. Heroku Deployment

#### Frontend (Static Export)
```bash
cd apps/frontend
npm install -g heroku
heroku create your-app-name
heroku buildpacks:set heroku/nodejs
git subtree push --prefix apps/frontend heroku main
```

#### Backend
```bash
cd apps/backend
heroku create your-backend-name
heroku config:set OPENAI_API_KEY=your_key
heroku addons:create heroku-redis:mini
git subtree push --prefix apps/backend heroku main
```

## Production Considerations

### Security
- Always use HTTPS in production
- Keep API keys secure using environment variables
- Implement rate limiting
- Use secure headers (implemented in nginx.conf)

### Performance
- Enable Redis for session storage
- Use CDN for static assets
- Implement proper caching strategies
- Monitor memory usage for WebSocket connections

### Monitoring
- Set up application monitoring (e.g., Sentry)
- Monitor WebSocket connection metrics
- Track API usage and rate limits
- Monitor Redis memory usage

### Scaling
- Use horizontal scaling for multiple backend instances
- Implement sticky sessions for WebSocket connections
- Consider using Redis Cluster for high availability
- Use load balancers with WebSocket support

## Troubleshooting

### Common Issues

1. **Vercel Deployment: Backend Errors / Frontend-Backend Communication Failed**
   
   **Problem**: Deployed both frontend and backend to Vercel, but they can't communicate.
   
   **Root Cause**: Vercel uses serverless functions which:
   - Have a maximum execution time of 10 seconds (60s on Pro)
   - Cannot maintain persistent WebSocket connections
   - Cannot run traditional Express servers
   
   **Solution**:
   - Deploy **only the frontend** to Vercel
   - Deploy the backend to Railway, Render, or Fly.io
   - Update `NEXT_PUBLIC_BACKEND_URL` in Vercel to point to your backend URL
   - Ensure CORS is properly configured on the backend
   
   **Correct Architecture**:
   ```
   Vercel (Frontend) → Railway/Render/Fly (Backend)
   ```

2. **WebSocket Connection Failed**
   - Ensure proxy supports WebSocket upgrades
   - Check firewall settings
   - Verify SSL certificate for WSS connections

2. **OpenAI API Errors**
   - Verify API key is correct
   - Check API rate limits
   - Ensure sufficient credits

3. **Build Failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify environment variables are set

4. **Performance Issues**
   - Monitor memory usage
   - Optimize frame rate settings
   - Check Redis connection

5. **Vercel "Routes Manifest Could Not Be Found" Error**
   - Ensure `vercel.json` doesn't override `outputDirectory` unnecessarily
   - Verify `buildCommand` is compatible with your project structure
   - For monorepos, use workspace-aware build commands
   - Avoid conflicting Next.js output modes (e.g., `standalone` with Vercel)
   - This error is resolved in the current configuration

### Logs
- Frontend: Check browser console and Vercel/Netlify logs
- Backend: Check server logs and PM2 logs (`pm2 logs`)
- Docker: `docker-compose logs -f`

## Support

For deployment issues:
1. Check the GitHub Issues page
2. Review the application logs
3. Verify all environment variables are correctly set
4. Test local deployment first

## CI/CD

The repository includes GitHub Actions workflows for:
- Continuous Integration (testing and building)
- Vercel deployment
- Netlify deployment  
- Docker image building and publishing

All workflows are in `.github/workflows/` directory.
#!/bin/bash

# Deployment Script for Realtime Assistant
# This script helps deploy the backend to Railway and frontend to Vercel

echo "🚀 Realtime Assistant Deployment Script"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env file exists with API key
if [ ! -f "apps/backend/.env" ]; then
    echo -e "${RED}❌ Backend .env file not found!${NC}"
    echo "Please create apps/backend/.env with your OPENAI_API_KEY"
    exit 1
fi

# Check for required tools
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed!${NC}"
        echo "Please install $1 first"
        return 1
    else
        echo -e "${GREEN}✅ $1 is installed${NC}"
        return 0
    fi
}

echo "Checking prerequisites..."
echo ""

check_command "node"
check_command "npm"
check_command "railway"
check_command "vercel"

echo ""
echo -e "${BLUE}📋 Step-by-Step Deployment Guide${NC}"
echo "=================================="
echo ""

echo -e "${YELLOW}BACKEND DEPLOYMENT (Railway)${NC}"
echo "-----------------------------"
echo ""
echo "1. Login to Railway:"
echo "   ${GREEN}railway login${NC}"
echo ""
echo "2. Initialize new Railway project:"
echo "   ${GREEN}railway init${NC}"
echo "   - Choose: 'Empty Project'"
echo ""
echo "3. Link to your backend:"
echo "   ${GREEN}cd apps/backend${NC}"
echo ""
echo "4. Deploy the backend:"
echo "   ${GREEN}railway up${NC}"
echo ""
echo "5. Set environment variables:"
echo "   ${GREEN}railway variables set OPENAI_API_KEY='your-openai-api-key-here'${NC}"
echo "   ${GREEN}railway variables set FRAME_RATE_LIMIT=2${NC}"
echo "   ${GREEN}railway variables set MAX_SESSIONS=100${NC}"
echo "   ${GREEN}railway variables set VISUAL_MAX_RESOLUTION=1024${NC}"
echo ""
echo "6. Generate public domain:"
echo "   ${GREEN}railway domain${NC}"
echo "   Copy this URL! You'll need it for Vercel."
echo ""
echo "   Or go to: https://railway.app/dashboard"
echo "   → Your project → Settings → Generate Domain"
echo ""

echo -e "${YELLOW}FRONTEND DEPLOYMENT (Vercel)${NC}"
echo "-----------------------------"
echo ""
echo "7. Navigate to frontend:"
echo "   ${GREEN}cd ../../apps/frontend${NC}"
echo ""
echo "8. Deploy to Vercel:"
echo "   ${GREEN}vercel${NC}"
echo "   - Follow the prompts"
echo "   - Set project name: realtime-assistant"
echo ""
echo "9. Set environment variable:"
echo "   ${GREEN}vercel env add NEXT_PUBLIC_BACKEND_URL production${NC}"
echo "   - Enter your Railway URL from step 6"
echo "   - Example: https://your-app.up.railway.app"
echo ""
echo "10. Deploy to production:"
echo "    ${GREEN}vercel --prod${NC}"
echo ""

echo -e "${BLUE}Alternative: Use Web Interfaces${NC}"
echo "================================"
echo ""
echo "Railway Web: https://railway.app"
echo "1. New Project → Deploy from GitHub"
echo "2. Select your repo"
echo "3. Set root directory: apps/backend"
echo "4. Add environment variables"
echo "5. Generate domain"
echo ""
echo "Vercel Web: https://vercel.com"
echo "1. Import GitHub repository"
echo "2. Root directory: apps/frontend"
echo "3. Add NEXT_PUBLIC_BACKEND_URL env var"
echo "4. Deploy"
echo ""

echo -e "${GREEN}📝 Your API Key is saved in apps/backend/.env${NC}"
echo "Make sure to keep it secure and never commit it to git!"
echo ""

echo -e "${YELLOW}Ready to start? Follow the steps above!${NC}"
echo ""
echo "Press Enter to open Railway in your browser..."
read
open https://railway.app
#!/bin/bash

echo "🚀 Baseball/Softball Schedule Manager - Render.com Deployment"
echo "=============================================================="
echo ""

# Check if all required files exist
echo "📋 Checking deployment files..."
if [ ! -f "server.prod.js" ]; then
    echo "❌ Error: server.prod.js not found!"
    exit 1
fi

if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found!"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    exit 1
fi

echo "✅ All deployment files found!"

# Check if dependencies are installed
echo ""
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Check if helmet is installed (required for production)
echo ""
echo "🔒 Checking security dependencies..."
if npm list helmet > /dev/null 2>&1; then
    echo "✅ Helmet security middleware installed"
else
    echo "📥 Installing helmet..."
    npm install helmet
fi

# Test production build
echo ""
echo "🧪 Testing production build..."
echo "Starting production server for testing..."
timeout 10s npm run start:prod > /dev/null 2>&1 &
SERVER_PID=$!
sleep 3

if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Production server started successfully"
    kill $SERVER_PID 2>/dev/null
else
    echo "❌ Error: Production server failed to start"
    echo "Please check server.prod.js for errors"
    exit 1
fi

# Check git status
echo ""
echo "📝 Checking git status..."
if git status --porcelain | grep -q .; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "   Consider committing before deployment:"
    echo "   git add . && git commit -m 'Update before deployment'"
    echo ""
else
    echo "✅ Working directory is clean"
fi

# Check if remote is set
echo ""
echo "🔗 Checking git remote..."
if git remote get-url origin > /dev/null 2>&1; then
    echo "✅ GitHub remote configured:"
    echo "   $(git remote get-url origin)"
else
    echo "❌ Error: No GitHub remote configured"
    echo "   Please run: git remote add origin <your-repo-url>"
    exit 1
fi

echo ""
echo "🎯 DEPLOYMENT READY!"
echo "===================="
echo ""
echo "Your Baseball/Softball Schedule Manager is ready for deployment!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to: https://render.com"
echo "2. Sign up/Login with GitHub"
echo "3. Click 'New +' → 'Web Service'"
echo "4. Connect your repository: $(basename -s .git $(git remote get-url origin))"
echo "5. Configure with these settings:"
echo "   - Name: baseball-schedule-manager"
echo "   - Environment: Node"
echo "   - Build Command: npm install"
echo "   - Start Command: npm run start:prod"
echo "   - Plan: Free"
echo ""
echo "6. Add Environment Variables:"
echo "   - NODE_ENV: production"
echo "   - PORT: 10000"
echo "   - DATABASE_PATH: /opt/render/project/src/schedules.db"
echo ""
echo "7. Click 'Create Web Service'"
echo ""
echo "⏱️  Expected deployment time: 5-10 minutes"
echo "🌐 Your live website will be available at: https://your-app-name.onrender.com"
echo ""
echo "📚 For detailed instructions, see: RENDER-DEPLOYMENT-GUIDE.md"
echo ""
echo "🚀 Happy deploying! Your complete website will be live soon!"

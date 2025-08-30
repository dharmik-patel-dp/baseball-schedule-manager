#!/bin/bash

# 🚀 Quick Render Deployment Script
# This script helps you deploy your Baseball project to Render

echo "⚾ Baseball Schedule Manager - Render Deployment"
echo "================================================"

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository. Please navigate to your project directory."
    exit 1
fi

# Check if we have uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes. Committing them now..."
    git add .
    git commit -m "🚀 Auto-commit before Render deployment"
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
if git push origin main; then
    echo "✅ Successfully pushed to GitHub!"
else
    echo "❌ Failed to push to GitHub. Please check your remote configuration."
    exit 1
fi

echo ""
echo "🎉 Your code is now on GitHub!"
echo ""
echo "📋 Next steps for Render deployment:"
echo "1. Go to [render.com](https://render.com)"
echo "2. Sign up/Login with GitHub"
echo "3. Click 'New +' → 'Web Service'"
echo "4. Connect your GitHub repository"
echo "5. Configure:"
echo "   - Name: baseball-schedule-manager"
echo "   - Environment: Node"
echo "   - Build Command: npm install"
echo "   - Start Command: node server.render.js"
echo "   - Environment Variables:"
echo "     - NODE_ENV: production"
echo "     - PORT: 10000"
echo "     - SESSION_SECRET: Generate (click button)"
echo "6. Click 'Create Web Service'"
echo ""
echo "🔗 Your GitHub repository: https://github.com/dharmik-patel-dp/baseball-schedule-manager"
echo "📚 Complete guide: GITHUB-RENDER-DEPLOYMENT.md"
echo ""
echo "�� Happy deploying!"

#!/bin/bash

echo "🚀 Baseball Schedule Manager - Render Deployment"
echo "================================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Please run: git init"
    exit 1
fi

# Check if files exist
if [ ! -f "server.render.js" ]; then
    echo "❌ server.render.js not found"
    exit 1
fi

if [ ! -f "render.yaml" ]; then
    echo "❌ render.yaml not found"
    exit 1
fi

echo "📁 Adding files to git..."
git add .

echo "💾 Committing changes..."
git commit -m "Deploy to Render - $(date)"

echo "⬆️ Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "Next steps:"
echo "1. Go to https://render.com"
echo "2. Sign up/Login with GitHub"
echo "3. Create PostgreSQL database (Starter plan)"
echo "4. Create Web Service (connect your repo)"
echo "5. Set environment variables"
echo "6. Deploy!"
echo ""
echo "📋 See RENDER-CHECKLIST.md for detailed instructions"
echo "🔧 Default login: admin/admin123 (change after deployment!)"

#!/bin/bash

# 🚀 Baseball/Softball Schedule Manager Deployment Script
# This script helps you prepare and deploy your application

echo "🚀 Baseball/Softball Schedule Manager - Deployment Preparation"
echo "=========================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if helmet is installed
if ! npm list helmet > /dev/null 2>&1; then
    echo "🔒 Installing helmet for security..."
    npm install helmet
fi

# Test production build
echo "🧪 Testing production build..."
NODE_ENV=production node server.prod.js &
PROD_PID=$!

# Wait a moment for server to start
sleep 3

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Production build test successful!"
    echo "🌐 Server running on http://localhost:3000"
    echo "🔗 Admin panel: http://localhost:3000/admin"
    
    # Stop the test server
    kill $PROD_PID 2>/dev/null
    
    echo ""
    echo "🎉 Your app is ready for deployment!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Push your code to GitHub:"
    echo "   git add ."
    echo "   git commit -m 'Ready for production deployment'"
    echo "   git push origin main"
    echo ""
    echo "2. Deploy to Render.com (recommended):"
    echo "   - Go to https://render.com"
    echo "   - Sign up with GitHub"
    echo "   - Create new Web Service"
    echo "   - Connect your repository"
    echo "   - Build Command: npm install"
    echo "   - Start Command: npm run start:prod"
    echo ""
    echo "3. Set environment variables:"
    echo "   NODE_ENV=production"
    echo "   PORT=10000"
    echo ""
    echo "📚 See DEPLOYMENT-GUIDE.md for detailed instructions"
    
else
    echo "❌ Production build test failed!"
    echo "Please check the error messages above"
    kill $PROD_PID 2>/dev/null
    exit 1
fi

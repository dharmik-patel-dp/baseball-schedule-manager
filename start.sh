#!/bin/bash

echo "🏟️  Starting Baseball/Softball Schedule Manager..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the application
echo "🚀 Starting the application..."
echo ""
echo "📍 Public Interface: http://localhost:3000"
echo "🔐 Admin Panel: http://localhost:3000/admin"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start 
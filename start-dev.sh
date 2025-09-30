#!/bin/bash

echo "🌾 Starting Krushi Sathi Development Server"
echo "=========================================="

# Check if concurrently is installed
if ! npm list concurrently > /dev/null 2>&1; then
    echo "📦 Installing concurrently..."
    npm install --save-dev concurrently
fi

echo "🚀 Starting both frontend and backend servers..."
echo ""
echo "Frontend (Vite):     http://localhost:8080"
echo "Backend (Express):   http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

npm run dev
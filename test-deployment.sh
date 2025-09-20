#!/bin/bash

# Pre-deployment test script
echo "🚀 Testing Krushi Sathi for Netlify deployment..."

# Check if required files exist
echo "📁 Checking required files..."
required_files=("package.json" "netlify.toml" "vite.config.ts" ".env")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    else
        echo "✅ Found: $file"
    fi
done

# Check environment variables
echo "🔧 Checking environment variables..."
if [ -z "$AI_API_KEY" ]; then
    echo "⚠️  AI_API_KEY not set (will need to be added in Netlify)"
else
    echo "✅ AI_API_KEY is set"
fi

# Test TypeScript compilation
echo "🔍 Running TypeScript check..."
npm run typecheck
if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors found. Fix before deploying."
    exit 1
else
    echo "✅ TypeScript check passed"
fi

# Test build
echo "🏗️  Testing build process..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Check errors above."
    exit 1
else
    echo "✅ Build successful"
fi

# Check build output
echo "📦 Checking build output..."
if [ ! -d "dist/spa" ]; then
    echo "❌ dist/spa directory not found"
    exit 1
else
    echo "✅ dist/spa directory created"
fi

if [ ! -d "netlify/functions" ]; then
    echo "❌ netlify/functions directory not found"
    exit 1
else
    echo "✅ netlify/functions directory exists"
fi

echo ""
echo "🎉 All checks passed! Ready for Netlify deployment."
echo ""
echo "Next steps:"
echo "1. Commit and push your code to GitHub"
echo "2. Connect repository to Netlify"
echo "3. Add environment variables in Netlify dashboard"
echo "4. Deploy!"
echo ""
echo "📋 Environment variables needed in Netlify:"
echo "   AI_API_KEY = your_google_ai_api_key"
echo "   DATABASE_URL = your_neon_connection_string"
echo "   NODE_ENV = production"
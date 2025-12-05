#!/bin/bash
# Startup script for AI Agent CodeCollab

echo "🚀 Starting AI Agent CodeCollab..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and set VITE_PAYMENT_RECIPIENT to your wallet address!"
    echo "Press Enter to continue after editing .env..."
    read
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "✅ Starting development server..."
echo "📡 Frontend will be available at: http://localhost:5173"
echo "🔗 Make sure backend is running at: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev


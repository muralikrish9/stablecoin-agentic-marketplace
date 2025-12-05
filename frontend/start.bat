@echo off
REM Startup script for AI Agent CodeCollab (Windows)

echo 🚀 Starting AI Agent CodeCollab...
echo.

REM Check if .env exists
if not exist .env (
    echo ⚠️  .env file not found!
    echo 📝 Creating .env from .env.example...
    copy .env.example .env
    echo.
    echo ⚠️  IMPORTANT: Edit .env and set VITE_PAYMENT_RECIPIENT to your wallet address!
    echo Press any key to continue after editing .env...
    pause >nul
)

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
    echo.
)

echo ✅ Starting development server...
echo 📡 Frontend will be available at: http://localhost:5173
echo 🔗 Make sure backend is running at: http://localhost:8000
echo.
echo Press Ctrl+C to stop
echo.

call npm run dev


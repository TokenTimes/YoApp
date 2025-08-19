#!/bin/bash

# Development startup script for Yo App
echo "🚀 Starting Yo App Development Environment"
echo "=========================================="

# Check if MongoDB is running (for local development)
echo "📊 Checking MongoDB connection..."
if command -v mongod &> /dev/null; then
    if pgrep mongod > /dev/null; then
        echo "✅ MongoDB is running locally"
    else
        echo "⚠️  MongoDB not running locally - make sure to configure MongoDB Atlas URI in server/config.js"
    fi
else
    echo "⚠️  MongoDB not found locally - make sure to configure MongoDB Atlas URI in server/config.js"
fi

# Start backend server in background
echo "🖥️  Starting backend server..."
cd server && npm run dev &
SERVER_PID=$!
cd ..

# Wait a moment for server to start
sleep 3

# Check if server started successfully
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Backend server is running on http://localhost:3000"
else
    echo "❌ Failed to start backend server"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Start Expo development server
echo "📱 Starting Expo development server..."
echo ""
echo "📋 Instructions:"
echo "1. Install 'Expo Go' app on your mobile device"
echo "2. Scan the QR code that appears below"
echo "3. The app will load on your device"
echo "4. Make sure your device and computer are on the same network"
echo ""
echo "🔧 Development Commands:"
echo "- Press 'i' to open iOS simulator"
echo "- Press 'a' to open Android emulator"
echo "- Press 'w' to open web version"
echo "- Press 'r' to reload the app"
echo "- Press 'c' to clear cache"
echo ""

npx expo start

# Cleanup when script exits
trap "echo '🛑 Shutting down servers...'; kill $SERVER_PID 2>/dev/null; exit" INT TERM


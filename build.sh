#!/bin/bash
set -e

echo "🏗️ Starting build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Build client
echo "🎨 Building client..."
cd client
npm run build
cd ..

# Copy client files to multiple locations for safety
echo "📂 Copying static files..."
mkdir -p public
mkdir -p server/public
cp -r client/dist/* public/
cp -r client/dist/* server/public/
ls -la public/

# Build server
echo "⚙️ Building server..."
cd server
npm run build
cd ..

echo "✅ Build complete!"
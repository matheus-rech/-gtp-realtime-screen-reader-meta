#!/usr/bin/env bash
# Render build script for backend

set -e

echo "Starting Render build for backend..."

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build TypeScript
echo "Building TypeScript..."
npm run build

# Verify build output
if [ ! -d "dist" ]; then
  echo "Error: dist directory not found after build"
  exit 1
fi

echo "Build completed successfully!"

# List built files for verification
echo "Built files:"
ls -la dist/
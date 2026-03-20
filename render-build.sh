#!/bin/bash
set -e

echo "Installing backend dependencies..."
cd backend
npm ci
cd ..

echo "Building frontend..."
cd frontend
npm ci
npm run build
cd ..

echo "Build completed successfully!"

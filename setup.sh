#!/bin/bash
# Deutsch Lernen Setup

# Clone repo
git clone https://github.com/fienbeh1/deutsch.git
cd deutsch

# Install LFS
git lfs install
git lfs track "*.pdf" "*.mp3" "*.m4a" "*.iso" "*.zip"
git lfs pull

# Install Node deps
npm install express pg cors

# Start server
echo "Starting server on port 3456..."
node backend/server2.js

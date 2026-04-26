#!/bin/bash
# Deutsch Lernen - Setup & Run Script
# Usage: ./setup.sh [command]

set -e

APP_DIR="/home/f/deutsch"
PORT=3456

echo "=== Deutsch Lernen Setup ==="

# Install dependencies if needed
if [ ! -d "$APP_DIR/node_modules" ]; then
  echo "Installing npm dependencies..."
  cd "$APP_DIR" && npm install
fi

# Install frontend dependencies
if [ ! -d "$APP_DIR/frontend-app/node_modules" ]; then
  echo "Installing frontend dependencies..."
  cd "$APP_DIR/frontend-app" && npm install
fi

# Start PostgreSQL (if not running)
if ! systemctl is-active --quiet postgresql; then
  echo "Starting PostgreSQL..."
  sudo systemctl start postgresql
fi

# Create database tables if needed
echo "Setting up database..."
psql -U f -d deutsch -c "
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  curso_id INT,
  lektion INT,
  page INT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  curso_id INT,
  lektion INT,
  page INT,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS user_answers (
  id SERIAL PRIMARY KEY,
  ejercicio_id INT,
  user_answer TEXT,
  correct BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);
"

# Start the server
echo "Starting server on port $PORT..."
cd "$APP_DIR"
node backend/server2.js &
PID=$!

echo "=== Server running at http://localhost:$PORT ==="
echo "To stop: kill $PID"
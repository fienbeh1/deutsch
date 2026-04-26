#!/bin/bash
# Run Deutsch Lernen app via Podman

IMAGE_NAME="deutsch-lernen:latest"
CONTAINER_NAME="deutsch-app"
PORT=3456

# Build the image
echo "Building Docker image..."
podman build -t $IMAGE_NAME .

# Run the container
echo "Starting container on port $PORT..."
podman run -d --name $CONTAINER_NAME \
  -v /home/f/deutsch:/app/Deutsch\ als\ Fremdsprache:ro \
  -p $PORT:$PORT \
  $IMAGE_NAME

echo "Deutsch Lernen is running at http://localhost:$PORT"
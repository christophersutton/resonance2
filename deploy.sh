#!/bin/bash

# Exit on any error
set -e

# Check if Docker is installed, if not install it
if ! command -q docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt-get update
    sudo apt-get install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
fi

# Install Docker Compose if not present
if ! command -v docker compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Pull the latest changes from the main branch
echo "Pulling latest changes..."
git pull origin main

# Create .env file if it doesn't exist
if [ ! -f "./packages/server/.env" ]; then
    echo "Creating .env file..."
    cp ./packages/server/.env.example ./packages/server/.env
fi

# Stop only the app container (keep nginx running to minimize downtime)
echo "Stopping app container..."
docker compose stop app

# Rebuild and restart only the app (database volume will be preserved)
echo "Rebuilding and starting app..."
docker compose up --build -d app

# Clean up unused images
echo "Cleaning up..."
docker image prune -f

echo "Deployment completed successfully!"

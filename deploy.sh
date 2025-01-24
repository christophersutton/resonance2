#!/bin/bash

# Pull the latest changes from the main branch
git pull origin main

# Stop only the app container (keep nginx running to minimize downtime)
docker compose stop app

# Rebuild and restart only the app (database volume will be preserved)
docker compose up --build -d app

# Clean up unused images
docker image prune -f

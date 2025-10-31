#!/bin/bash

# Railway environment variables update script
# Run this after linking your Railway project

echo "Setting Railway environment variables for CORS..."

# Set the required environment variables
railway variables set ALLOWED_ORIGINS="https://mydscvr.ai,https://www.mydscvr.ai,https://api.mydscvr.ai"
railway variables set FRONTEND_URL="https://mydscvr.ai"
railway variables set NODE_ENV="production"

echo "Environment variables updated. Redeploying..."
railway up

echo "Done! Your CORS should now be properly configured."

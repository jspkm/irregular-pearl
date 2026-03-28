#!/bin/bash
# Seed Irregular Pearl database
# Usage: ./seed.sh

# Load from .env if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Missing required env vars."
  echo ""
  echo "Either create a .env file with:"
  echo "  PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
  echo "  SUPABASE_SERVICE_ROLE_KEY=eyJ..."
  echo ""
  echo "Or run directly:"
  echo "  PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ./seed.sh"
  exit 1
fi

echo "Seeding Irregular Pearl at $PUBLIC_SUPABASE_URL"
bun run supabase/seed.ts

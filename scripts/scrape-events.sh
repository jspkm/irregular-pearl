#!/bin/bash
# Local cron script for event scraping.
# Runs Bachtrack + Google Events scrapers from your machine (home IP).
#
# Setup:
#   1. Create .env.local with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
#   2. crontab -e, add:
#      0 3 */3 * * /Users/jspkm/dev/irregular-pearl/scripts/scrape-events.sh >> /tmp/scrape-events.log 2>&1

cd /Users/jspkm/dev/irregular-pearl

# Load env from .env.local (gitignored)
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "$(date): ERROR — SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local"
  exit 1
fi

echo "$(date): Starting scrape..."
/Users/jspkm/.bun/bin/bun run src/lib/scrapers/runner.ts
echo "$(date): Done."

# TODOS

Deferred work from Events page feature (CEO plan, 2026-04-03).

## Phase 2: Events Enhancements

### Eventbrite Scraper Adapter
Add Eventbrite API as a second scraping source. The adapter interface already supports it.
Requires API key. Lower classical coverage than Bachtrack.
**Priority:** P2 | **Effort:** S (CC: ~15 min) | **Blocked by:** nothing

### Multi-Day Festival Support
`event_date` is a single date. Multi-day festivals need an `end_date` column.
For now, festivals are listed on their start date.
**Priority:** P3 | **Effort:** S (CC: ~15 min) | **Blocked by:** nothing

### Timezone Support
`start_time` is a time without timezone. Calendar/archive boundaries use server timezone.
Add a `timezone` column for accurate display across regions.
**Priority:** P2 | **Effort:** S (CC: ~15 min) | **Blocked by:** nothing

### Dedup Unique Index
App-level dedup (title+venue+date) has no DB constraint. Race conditions could create
duplicates at scale. Add a unique index on (title, venue, event_date).
**Priority:** P2 | **Effort:** S (CC: ~10 min) | **Blocked by:** nothing

### Scraper Update/Merge
Once a scraped event is inserted, changed times/venues from the source don't propagate.
Add source_id tracking and a merge step in the scraper runner.
**Priority:** P3 | **Effort:** M (CC: ~30 min) | **Blocked by:** nothing

### User Preferred City
Store the user's preferred city in their profile (`users.preferred_city` column).
Auto-filter the events page on return visits. Currently uses query-string + Cloudflare IP.
**Priority:** P3 | **Effort:** S (CC: ~15 min) | **Blocked by:** nothing

### CAPTCHA on Submissions
Per-user rate limit (5/hr) is application-level only. If abuse scales beyond moderation
capacity, add CAPTCHA to the submission form.
**Priority:** P3 | **Effort:** S (CC: ~15 min) | **Blocked by:** abuse reaching critical levels

### Image Resize on Upload
Resize poster images to max 800px width on upload. Currently uploading originals.
Use sharp or Supabase image transforms.
**Priority:** P2 | **Effort:** S (CC: ~15 min) | **Blocked by:** nothing

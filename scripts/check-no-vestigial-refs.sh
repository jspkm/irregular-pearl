#!/usr/bin/env bash
# Grep-gate preventing reintroduction of vestigial identifiers that have been
# fully removed. Run via `bun run check:vestigial`. Exits non-zero with
# specific locations if any dead identifier reappears in src/ or supabase/
# (excluding migration files, which preserve history).
#
# Vestigial identifiers tracked here:
#   - performers_note_id  — dropped from notifications in migration
#                           20260426000000_drop_vestigial_performers_note_id.sql.
#                           Callers must use (subject_table, subject_id).

set -euo pipefail

# Identifiers to ban. One per line.
IDENTIFIERS=(
  'performers_note_id'
)

EXIT=0

for id in "${IDENTIFIERS[@]}"; do
  # Search src/ and supabase/functions/ — not supabase/migrations/ (history).
  HITS=$(grep -rn --include='*.ts' --include='*.tsx' --include='*.astro' \
    -e "$id" src/ supabase/functions/ 2>/dev/null || true)

  if [ -n "$HITS" ]; then
    echo "ERROR: vestigial identifier '$id' still referenced in source:" >&2
    echo "$HITS" >&2
    echo "" >&2
    EXIT=1
  fi
done

if [ $EXIT -eq 0 ]; then
  echo "OK: no vestigial identifiers found in src/ or supabase/functions/"
fi

exit $EXIT

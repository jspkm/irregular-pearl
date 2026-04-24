#!/usr/bin/env bash
# Grep-gate preventing reintroduction of the "click → sign-in modal →
# intent lost" bug. Every anon-facing affordance must route through
# src/lib/useRequireAuth.ts's `gate()` so the pending action auto-resumes
# after sign-in. Without this guard, a new component can ad-hoc
# `setSignInOpen(true)` and break the contract, the same way
# StartContributionButton / RequestContributionDialog / SearchTypeahead
# drifted in PRs 4–6.
#
# Run via `bun run check:auth-gate`. Exits non-zero with locations if any
# banned pattern appears outside the sanctioned producers.
#
# Sanctioned locations (anything else is a bug):
#   src/lib/useRequireAuth.ts        — owns signInOpen state
#   src/components/AuthButton.tsx    — navbar sign-in (top-level, no pending action)
#   src/components/SignInPanel.tsx   — the modal itself
#
# Banned patterns (search across src/**/*.{ts,tsx,astro}):
#   1. `setSignInOpen(true)` / `setSignInPrompt(true)` — direct modal
#      pop without the gate. Should be `gate(() => ...)` instead.
#   2. `?signin=1` / `?sign_in=1` URLs — full-page detour through the
#      home page. Use gate() to open the modal inline instead. The only
#      sanctioned producer of that URL is privateRoute.ts (for private
#      pages where the page itself shouldn't render).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

EXIT=0

# Files allowed to reference setSignInOpen / setSignInPrompt.
# Add to this list only when the anon click pattern intrinsically cannot
# use gate() (e.g. AuthButton has no pending action).
ALLOWED_STATE_FILES=(
  'src/components/AuthButton.tsx'
  'src/lib/useRequireAuth.ts'
)

# Files allowed to reference the signin query-param URL.
ALLOWED_URL_FILES=(
  'src/lib/privateRoute.ts'
  'src/components/AuthButton.tsx'
)

join_alt() { local IFS='|'; echo "$*"; }

STATE_PATTERN='setSignInOpen\(true\)|setSignInPrompt\(true\)'
URL_PATTERN='\?signin=1|\?sign_in=1'

ALLOWED_STATE_REGEX="^($(join_alt "${ALLOWED_STATE_FILES[@]}"))$"
ALLOWED_URL_REGEX="^($(join_alt "${ALLOWED_URL_FILES[@]}"))$"

check() {
  local label="$1"
  local pattern="$2"
  local allowed_regex="$3"
  local guidance="$4"

  # Test files are excluded — regression tests often cite the bug by
  # name (`/?sign_in=1`) in comments to document what they're pinning.
  local hits
  hits=$(grep -rnE --include='*.ts' --include='*.tsx' --include='*.astro' \
    --exclude='*.test.ts' --exclude='*.test.tsx' \
    "$pattern" src/ 2>/dev/null || true)

  if [ -z "$hits" ]; then
    return 0
  fi

  local filtered=""
  while IFS= read -r line; do
    local file="${line%%:*}"
    if [[ ! "$file" =~ $allowed_regex ]]; then
      filtered+="$line"$'\n'
    fi
  done <<< "$hits"

  if [ -n "$filtered" ]; then
    echo "ERROR: banned auth-gate pattern ($label):" >&2
    echo "$filtered" >&2
    echo "" >&2
    echo "$guidance" >&2
    echo "" >&2
    EXIT=1
  fi
}

check 'direct sign-in modal pop' "$STATE_PATTERN" "$ALLOWED_STATE_REGEX" \
  "Use the shared hook: const { gate, signInOpen, onClose, onSignedIn } = useRequireAuth();
 Then wrap the click: onClick={() => gate(() => doThing())}
 The hook stashes the action and auto-resumes it after sign-in so users
 don't have to re-click. See src/lib/useRequireAuth.ts for the contract."

check 'sign-in redirect URL' "$URL_PATTERN" "$ALLOWED_URL_REGEX" \
  "Opening the sign-in modal via a full-page redirect to /?signin=1 drops
 the user on the home page. Use useRequireAuth().gate() to open the
 SignInPanel inline on the current page instead."

exit $EXIT

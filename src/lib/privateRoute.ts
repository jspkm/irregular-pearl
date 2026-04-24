// Shared client-side redirect for private routes.
//
// Private routes are pages that require sign-in (and possibly a specific
// role). When an anonymous or unauthorized viewer reaches one, the page
// shouldn't leak what it contains. The unified posture: silently redirect.
//
//   - Anon (not signed in): replace to `/?signin=1` so the home page's
//     AuthButton auto-opens the SignInPanel modal. URL leaves no trace
//     of the source page.
//   - Signed in but lacking role/permission: replace to `/`. They're
//     already authed, no modal needed; sending them home is the gentlest
//     "you can't be here" without naming the page.
//
// Called from inside a useEffect on each private-page island after the
// auth check resolves. SSR-safe (no-op if window is undefined).

/** Query param that makes the home-page AuthButton auto-open the SignInPanel.
 *  Single source of truth — any producer sending anon users to the modal must
 *  use this constant (and AuthButton reads it) so the two sides can't drift. */
export const SIGN_IN_PARAM = 'signin';
export const SIGN_IN_TRIGGER_URL = `/?${SIGN_IN_PARAM}=1`;

export function redirectFromPrivateRoute(isSignedIn: boolean): void {
  if (typeof window === 'undefined') return;
  const target = isSignedIn ? '/' : SIGN_IN_TRIGGER_URL;
  window.location.replace(target);
}

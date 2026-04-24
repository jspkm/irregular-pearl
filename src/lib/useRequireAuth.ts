// Shared "click → maybe sign in → resume" gate.
//
// Every anon-facing contributor affordance uses the same motion: the user
// clicks something (vote, write, add, edit, swap), we check auth, if anon
// we pop the SignInPanel. Before this hook, that's where the flow stalled —
// after sign-in the modal closed but the original intent was lost, so the
// user had to click again.
//
// gate(action) stashes the action in a ref and opens the modal. On
// cancellation (close prop) the pending action is cleared. On successful
// password sign-in (onSignedIn prop) the pending action runs and the modal
// closes. The success/cancel split prevents an old stashed action from
// firing later if the user dismissed the modal and signed in elsewhere.
//
// Consumers render their own SignInPanel so they can set title/body per
// surface; this hook only owns state and wires the callbacks.
//
// --- OAuth resume (optional) ----------------------------------------------
// Google OAuth redirects off-page, so an in-memory closure can't survive
// the round-trip. For intents that ARE serializable as a URL (e.g. "go
// to /piece/X?expand=1 after sign-in"), pass `resumeUrl` in gate's
// options: it's routed to SignInPanel's `redirectTo` prop and Google
// redirects the user straight there post-auth. Intents that mutate local
// state (setMode('write'), optimistic vote, open inline editor) do NOT
// survive OAuth because the page reloads and React state is wiped — the
// user has to click the affordance again. That's an inherent limit of
// OAuth redirect flow, not a bug in this hook. Password sign-in resumes
// every kind of intent because no reload happens.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

export interface GateOptions {
  /** Target URL passed to OAuth redirectTo. Use when the pending action
   *  is a navigation (e.g. "load /piece/X?expand=1") so OAuth round-trip
   *  lands directly on the completed state. Defaults to the current URL. */
  resumeUrl?: string;
}

export interface RequireAuth {
  user: ReturnType<typeof useAuth>['user'];
  loading: boolean;
  /** True while the SignInPanel should be rendered. */
  signInOpen: boolean;
  /** Pass as `onClose` on SignInPanel. */
  onClose: () => void;
  /** Pass as `onSignedIn` on SignInPanel. */
  onSignedIn: () => void;
  /** Pass as `redirectTo` on SignInPanel. Populated from the latest
   *  gate() call's resumeUrl (or undefined to default to current URL). */
  redirectTo: string | undefined;
  /** Run `action` if signed in, otherwise open the SignInPanel and run
   *  `action` after successful password sign-in. `options.resumeUrl`
   *  additionally covers OAuth round-trip for navigation intents. No-op
   *  while auth is loading. */
  gate: (action: () => void, options?: GateOptions) => void;
}

export function useRequireAuth(): RequireAuth {
  const { user, loading } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | undefined>(undefined);
  const pendingRef = useRef<(() => void) | null>(null);

  // Belt-and-braces: if the user was already signed in while a pending
  // action was stashed (edge cases like auth resolving between click and
  // render), run it on the next auth tick.
  useEffect(() => {
    if (user && pendingRef.current) {
      const action = pendingRef.current;
      pendingRef.current = null;
      setSignInOpen(false);
      action();
    }
  }, [user]);

  const gate = useCallback(
    (action: () => void, options?: GateOptions) => {
      if (loading) return;
      if (!user) {
        pendingRef.current = action;
        setRedirectTo(options?.resumeUrl);
        setSignInOpen(true);
        return;
      }
      action();
    },
    [user, loading],
  );

  const onClose = useCallback(() => {
    // Cancellation — drop the pending action so it can't resurrect later
    // if the user signs in through an unrelated surface.
    pendingRef.current = null;
    setRedirectTo(undefined);
    setSignInOpen(false);
  }, []);

  const onSignedIn = useCallback(() => {
    const action = pendingRef.current;
    pendingRef.current = null;
    setRedirectTo(undefined);
    setSignInOpen(false);
    // The SignInPanel calls this right after a successful auth.signInWith*
    // call resolves. useAuth's onAuthStateChange listener may not have
    // flipped user to non-null yet, but the action doesn't care — it runs
    // now, and any RPC it calls will see the fresh session because supabase
    // has already applied it.
    if (action) action();
  }, []);

  return { user, loading, signInOpen, onClose, onSignedIn, redirectTo, gate };
}

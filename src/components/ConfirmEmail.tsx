// Landing page for the Supabase signup-confirmation email link. Supabase
// includes an access token in the URL hash; the JS client parses it on page
// load and fires onAuthStateChange("SIGNED_IN") with a real session. We wait
// briefly for that event and then show a success state + auto-redirect.
//
// If no session materializes within a short window, the link was either
// malformed, expired, or already consumed — in that case we surface a
// "link invalid or expired" message and let the user go back to sign in.

import { useEffect, useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';

type State =
  | { kind: 'waiting' }
  | { kind: 'confirmed' }
  | { kind: 'error'; message: string };

const REDIRECT_DELAY_MS = 1800;
const WAIT_TIMEOUT_MS = 5000;

export default function ConfirmEmail() {
  const [state, setState] = useState<State>({ kind: 'waiting' });

  useEffect(() => {
    if (!hasSupabase) {
      setState({ kind: 'error', message: 'Supabase is not configured.' });
      return;
    }

    let settled = false;
    const finish = (next: State) => {
      if (settled) return;
      settled = true;
      setState(next);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish({ kind: 'confirmed' });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) return;
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        finish({ kind: 'confirmed' });
      }
    });

    const timeout = window.setTimeout(() => {
      finish({
        kind: 'error',
        message: 'This confirmation link is invalid or has expired. Try signing in — if your email is still unconfirmed, you can resend the link from there.',
      });
    }, WAIT_TIMEOUT_MS);

    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (state.kind !== 'confirmed') return;
    const id = window.setTimeout(() => { window.location.href = '/'; }, REDIRECT_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [state.kind]);

  if (state.kind === 'waiting') {
    return (
      <>
        <h1 className="font-display text-[26px] mb-4">Confirming your email…</h1>
        <p className="text-sm text-muted">One moment while we finish signing you in.</p>
      </>
    );
  }

  if (state.kind === 'confirmed') {
    return (
      <>
        <h1 className="font-display text-[26px] mb-4">Welcome to Irregular Pearl</h1>
        <div className="ip-signin-info" role="status">
          Email confirmed. Redirecting you home…
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-[26px] mb-4">Confirmation link issue</h1>
      <div className="ip-signin-error" role="alert">{state.message}</div>
      <p className="mt-6 text-sm">
        <a href="/" className="text-accent underline">Go home</a>
      </p>
    </>
  );
}

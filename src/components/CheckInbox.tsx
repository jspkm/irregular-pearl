// Post-signup landing page. Shown after a successful signup where email
// confirmation is required. Tells the user to check their inbox, surfaces
// the email they signed up with, and offers a resend button.
//
// The email is passed via ?email=... in the URL. We don't trust it for auth,
// only for display + resend-target — Supabase will only send if that email
// actually has an unconfirmed account.

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';

type Status =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'sent' }
  | { kind: 'error'; message: string };

export default function CheckInbox() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get('email') ?? '');
  }, []);

  const resend = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!hasSupabase || !email) return;
    setStatus({ kind: 'busy' });
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    if (error) {
      setStatus({ kind: 'error', message: error.message });
      return;
    }
    setStatus({ kind: 'sent' });
  }, [email]);

  return (
    <>
      <h1 className="font-display text-[28px] mb-4">Check your inbox</h1>
      <p className="text-ink text-[15px] leading-relaxed mb-2">
        We&rsquo;ve sent a confirmation link{email ? <> to <strong className="text-ink">{email}</strong></> : null}.
      </p>
      <p className="text-muted text-sm mb-8">
        Click the link in the email to finish creating your account. You can close this tab
        in the meantime — once you confirm, you&rsquo;ll be signed in automatically.
      </p>

      {status.kind === 'sent' && (
        <div className="ip-signin-info mb-4" role="status">
          Confirmation email resent. Check your inbox.
        </div>
      )}
      {status.kind === 'error' && (
        <div className="ip-signin-error mb-4" role="alert">{status.message}</div>
      )}

      <form onSubmit={resend} className="flex items-center gap-3">
        <button
          type="submit"
          className="ip-signin-btn ip-signin-btn-ghost"
          disabled={status.kind === 'busy' || !email}
        >
          {status.kind === 'busy' ? 'Sending…' : 'Resend confirmation email'}
        </button>
        <a href="/" className="text-sm text-muted underline hover:text-accent">
          Back to home
        </a>
      </form>
    </>
  );
}

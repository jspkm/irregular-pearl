// Password-recovery landing page form. When Supabase sends the reset email,
// the link brings the user here with a recovery token in the URL hash; the
// JS client picks that up and raises an onAuthStateChange("PASSWORD_RECOVERY")
// event with a valid session, at which point calling updateUser({ password })
// sets a new password on that account (works for both email/password users
// and Google-only users who had no password before).

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';

type Status =
  | { kind: 'idle' }
  | { kind: 'waiting' }
  | { kind: 'ready' }
  | { kind: 'busy' }
  | { kind: 'done' }
  | { kind: 'error'; message: string };

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'waiting' });

  useEffect(() => {
    if (!hasSupabase) {
      setStatus({ kind: 'error', message: 'Supabase is not configured.' });
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus({ kind: 'ready' });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setStatus({ kind: 'ready' });
      } else if (event === 'SIGNED_IN' && session) {
        setStatus((s) => (s.kind === 'waiting' ? { kind: 'ready' } : s));
      }
    });

    const timeout = window.setTimeout(() => {
      setStatus((s) => s.kind === 'waiting'
        ? { kind: 'error', message: 'Recovery link is missing or expired. Request a new one from the sign-in screen.' }
        : s);
    }, 4000);

    return () => { sub.subscription.unsubscribe(); window.clearTimeout(timeout); };
  }, []);

  const submit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setStatus({ kind: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }
    if (password !== confirm) {
      setStatus({ kind: 'error', message: 'Passwords do not match.' });
      return;
    }
    setStatus({ kind: 'busy' });
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus({ kind: 'error', message: error.message });
      return;
    }
    setStatus({ kind: 'done' });
    setPassword('');
    setConfirm('');
    setTimeout(() => { window.location.href = '/'; }, 1800);
  }, [password, confirm]);

  if (status.kind === 'waiting') {
    return <p className="text-sm text-muted">Validating recovery link…</p>;
  }

  if (status.kind === 'done') {
    return (
      <div className="ip-signin-info" role="status">
        Password updated. Redirecting to the home page…
      </div>
    );
  }

  const disabled = status.kind === 'busy' || status.kind === 'error' && !password;

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="ip-signin-field">
        <span>New password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          autoComplete="new-password"
          autoFocus
        />
      </label>
      <label className="ip-signin-field">
        <span>Confirm password</span>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={6}
          required
          autoComplete="new-password"
        />
      </label>

      {status.kind === 'error' && (
        <div className="ip-signin-error" role="alert">{status.message}</div>
      )}

      <div className="ip-signin-actions">
        <button
          type="submit"
          className="ip-signin-btn ip-signin-btn-primary"
          disabled={disabled}
        >
          {status.kind === 'busy' ? 'Saving…' : 'Set new password'}
        </button>
      </div>
    </form>
  );
}

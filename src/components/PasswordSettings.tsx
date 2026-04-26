// Settings-page section for setting or changing an account password.
// Works for both kinds of users:
//   - Email/password users: enter current + new → updateUser({ password }).
//   - Google-signed-up users with no password yet: same updateUser call
//     attaches an `email` identity to the existing auth.users row, so they
//     can subsequently sign in with email + password too.
//
// Supabase's updateUser({ password }) does not require the current password,
// but we collect it as a UX/security check and re-authenticate with
// signInWithPassword before calling update. For users with no password on
// file (pure Google signup), we skip the check.

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

type Status =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'done'; message: string }
  | { kind: 'error'; message: string };

export default function PasswordSettings() {
  const { user, loading } = useAuth();
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => {
    if (!user) { setHasPassword(null); return; }
    // auth.users identities are not directly queryable from the anon client,
    // but the user object exposes `identities` via getUser.
    supabase.auth.getUser().then(({ data }) => {
      const identities = data.user?.identities ?? [];
      setHasPassword(identities.some((i) => i.provider === 'email'));
    });
  }, [user?.id]);

  const submit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!hasSupabase || !user?.email) return;
    if (next.length < 6) {
      setStatus({ kind: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }
    if (next !== confirm) {
      setStatus({ kind: 'error', message: 'Passwords do not match.' });
      return;
    }
    setStatus({ kind: 'busy' });

    if (hasPassword) {
      const { error: reauthErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (reauthErr) {
        setStatus({ kind: 'error', message: 'Current password is incorrect.' });
        return;
      }
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) {
      setStatus({ kind: 'error', message: error.message });
      return;
    }
    setStatus({
      kind: 'done',
      message: hasPassword ? 'Password updated.' : 'Password set. You can now sign in with email and password.',
    });
    setCurrent('');
    setNext('');
    setConfirm('');
    setHasPassword(true);
  }, [current, next, confirm, hasPassword, user?.email]);

  if (loading) return null;
  if (!hasSupabase || !user) {
    return (
      <div className="text-center py-10 text-muted text-sm">
        Sign in to manage your password.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl">Password</h2>
        {status.kind === 'done' && <span className="text-xs text-success">{status.message}</span>}
      </div>

      <p className="text-sm text-muted mb-5">
        {hasPassword
          ? 'Update your account password. You will need to re-enter your current password to confirm.'
          : 'Your account was created via Google. Set a password to also sign in with email and password.'}
      </p>

      <form onSubmit={submit} className="flex flex-col gap-3 max-w-105">
        {hasPassword && (
          <label className="ip-signin-field">
            <span>Current password</span>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
        )}
        <label className="ip-signin-field">
          <span>New password</span>
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>
        <label className="ip-signin-field">
          <span>Confirm new password</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>

        {status.kind === 'error' && (
          <div className="ip-signin-error" role="alert">{status.message}</div>
        )}

        <div className="ip-signin-actions">
          <button
            type="submit"
            className="ip-signin-btn ip-signin-btn-primary"
            disabled={status.kind === 'busy'}
          >
            {status.kind === 'busy' ? 'Saving…' : hasPassword ? 'Update password' : 'Set password'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Shared sign-in / register / password-reset surface. Renders a centered
// modal with three flows: choose-provider (Google + email), email-only
// (sign in or create account), and forgot-password (request reset link).
//
// Used from the navbar AuthButton and from every anon "requires auth"
// prompt (EditionsList, VoteThumbs, ExternalRefsList, MovementsList,
// MovementEdit). Style primitives live in src/styles/global.css under the
// .ip-signin-* namespace so the modal works on every page regardless of
// which scoped stylesheets load.

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';

type Mode = 'choose' | 'signin' | 'signup' | 'forgot';
type Status =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'error'; message: string }
  | { kind: 'unconfirmed'; email: string }
  | { kind: 'info'; message: string };

interface Props {
  onClose: () => void;
  title?: string;
  body?: ReactNode;
}

export default function SignInPanel({ onClose, title = 'Sign in', body }: Props) {
  const [mode, setMode] = useState<Mode>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const switchMode = useCallback((next: Mode) => {
    setStatus({ kind: 'idle' });
    setPassword('');
    setMode(next);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!hasSupabase) return;
    setStatus({ kind: 'busy' });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
    if (error) setStatus({ kind: 'error', message: prettyAuthError(error.message) });
  }, []);

  const submitSignIn = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!hasSupabase) return;
    setStatus({ kind: 'busy' });
    const trimmed = email.trim();
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    });
    if (error) {
      if (/email not confirmed/i.test(error.message)) {
        setStatus({ kind: 'unconfirmed', email: trimmed });
        return;
      }
      setStatus({ kind: 'error', message: prettyAuthError(error.message) });
      return;
    }
    onClose();
  }, [email, password, onClose]);

  const resendConfirmation = useCallback(async (addr: string) => {
    if (!hasSupabase) return;
    setStatus({ kind: 'busy' });
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: addr,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    if (error) {
      setStatus({ kind: 'error', message: prettyAuthError(error.message) });
      return;
    }
    setStatus({
      kind: 'info',
      message: 'Confirmation email sent. Check your inbox.',
    });
  }, []);

  const submitSignUp = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!hasSupabase) return;
    setStatus({ kind: 'busy' });
    const trimmed = email.trim();
    const { data, error } = await supabase.auth.signUp({
      email: trimmed,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    if (error) {
      setStatus({ kind: 'error', message: prettyAuthError(error.message) });
      return;
    }
    if (data.session) {
      onClose();
      return;
    }
    window.location.href = `/auth/check-inbox?email=${encodeURIComponent(trimmed)}`;
  }, [email, password, onClose]);

  const submitForgot = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!hasSupabase) return;
    setStatus({ kind: 'busy' });
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    if (error) {
      setStatus({ kind: 'error', message: prettyAuthError(error.message) });
      return;
    }
    setStatus({
      kind: 'info',
      message: 'If that email has an account, a reset link is on its way.',
    });
  }, [email]);

  const busy = status.kind === 'busy';
  const heading = mode === 'forgot' ? 'Reset your password'
    : mode === 'signup' ? 'Create an account'
    : title;

  return (
    <>
      <div className="ip-signin-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="ip-signin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ip-signin-title"
      >
        <button
          type="button"
          className="ip-signin-close"
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>

        <h2 id="ip-signin-title" className="ip-signin-title">{heading}</h2>

        {mode === 'choose' && body && <p className="ip-signin-body">{body}</p>}

        {mode === 'choose' && (
          <>
            <button
              type="button"
              className="ip-signin-google"
              onClick={signInWithGoogle}
              disabled={busy}
              autoFocus
            >
              <GoogleMark /> Continue with Google
            </button>

            <button
              type="button"
              className="ip-signin-alt"
              onClick={() => switchMode('signin')}
              disabled={busy}
            >
              Continue with email
            </button>

            <div className="ip-signin-sep" aria-hidden="true"><span>or</span></div>

            <button
              type="button"
              className="ip-signin-create"
              onClick={() => switchMode('signup')}
              disabled={busy}
            >
              Create an account
            </button>

            {status.kind === 'error' && (
              <div className="ip-signin-error" role="alert">{status.message}</div>
            )}
          </>
        )}

        {(mode === 'signin' || mode === 'signup') && (
          <form onSubmit={mode === 'signin' ? submitSignIn : submitSignUp}>
            <label className="ip-signin-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                autoFocus
              />
            </label>
            <label className="ip-signin-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                minLength={6}
                required
              />
            </label>

            {status.kind === 'error' && (
              <div className="ip-signin-error" role="alert">{status.message}</div>
            )}
            {status.kind === 'info' && (
              <div className="ip-signin-info" role="status">{status.message}</div>
            )}
            {status.kind === 'unconfirmed' && (
              <div className="ip-signin-error" role="alert">
                This account&rsquo;s email isn&rsquo;t confirmed yet. Check your inbox for the confirmation link, or resend it.
                <button
                  type="button"
                  className="ip-signin-link-btn"
                  onClick={() => resendConfirmation(status.email)}
                  disabled={busy}
                >
                  Resend confirmation email
                </button>
              </div>
            )}

            <div className="ip-signin-actions">
              <button
                type="button"
                className="ip-signin-btn ip-signin-btn-ghost"
                onClick={() => switchMode('choose')}
                disabled={busy}
              >
                Back
              </button>
              <button
                type="submit"
                className="ip-signin-btn ip-signin-btn-primary"
                disabled={busy}
              >
                {busy ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </div>

            <div className="ip-signin-sublinks">
              {mode === 'signin' ? (
                <>
                  <a href="#" onClick={(e) => { e.preventDefault(); switchMode('signup'); }}>
                    Create an account
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); switchMode('forgot'); }}>
                    Forgot password?
                  </a>
                </>
              ) : (
                <a href="#" onClick={(e) => { e.preventDefault(); switchMode('signin'); }}>
                  Have an account? Sign in
                </a>
              )}
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={submitForgot}>
            <p className="ip-signin-body">
              Enter your email and we&rsquo;ll send a reset link.
            </p>
            <label className="ip-signin-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                autoFocus
              />
            </label>

            {status.kind === 'error' && (
              <div className="ip-signin-error" role="alert">{status.message}</div>
            )}
            {status.kind === 'info' && (
              <div className="ip-signin-info" role="status">{status.message}</div>
            )}

            <div className="ip-signin-actions">
              <button
                type="button"
                className="ip-signin-btn ip-signin-btn-ghost"
                onClick={() => switchMode('signin')}
                disabled={busy}
              >
                Back
              </button>
              <button
                type="submit"
                className="ip-signin-btn ip-signin-btn-primary"
                disabled={busy}
              >
                {busy ? '…' : 'Send reset link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

function prettyAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return 'Email or password is incorrect.';
  }
  if (m.includes('already registered') || m.includes('already exists') || m.includes('user already')) {
    return 'That email already has an account. Try signing in instead.';
  }
  if (m.includes('rate') && m.includes('limit')) {
    return 'Too many attempts — wait a minute and try again.';
  }
  if (m.includes('password') && (m.includes('6') || m.includes('short'))) {
    return 'Password must be at least 6 characters.';
  }
  if (m.includes('email') && m.includes('valid')) {
    return 'Please enter a valid email.';
  }
  if (m.includes('email not confirmed')) {
    return 'Confirm your email first — check your inbox.';
  }
  return msg;
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.68 9c0-.593.102-1.17.284-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

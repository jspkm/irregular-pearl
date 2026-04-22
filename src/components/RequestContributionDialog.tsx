// Request-a-contribution dialog. Rendered as a ghost-style trigger button
// that opens a modal. Inside the modal: recipient picker (username for any
// logged-in user; email is staff-only), optional personal note (280 char
// cap), submit. Calls request_contribution RPC; maps structured RPC errors
// to user-facing copy that mirrors the design doc's copy table.
//
// Signed-out click routes to the existing sign-in prompt and never opens
// the modal, per the feedback-memory convention that anon clicks open
// sign-in instead of hiding.
//
// Piece context is a prop, not something the user picks inside the dialog.
// The dialog is always launched from a specific piece page.

import { useEffect, useRef, useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

interface Props {
  pieceId: string;
  pieceTitle: string;
  composerName: string;
  /** Visible text on the trigger button. */
  triggerLabel: string;
  /** Optional class list for the trigger button (e.g. .pp-cta-ghost). */
  triggerClassName?: string;
}

type Mode = 'username' | 'email';

export default function RequestContributionDialog({
  pieceId,
  pieceTitle,
  composerName,
  triggerLabel,
  triggerClassName,
}: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [mode, setMode] = useState<Mode>('username');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Look up staff role when the user session hydrates.
  useEffect(() => {
    if (!user || !hasSupabase) {
      setIsStaff(false);
      return;
    }
    let cancelled = false;
    supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        const r = (data as { role?: string } | null)?.role;
        setIsStaff(r === 'admin' || r === 'moderator');
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Autofocus first field when opening.
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => firstInputRef.current?.focus());
    }
  }, [open, mode]);

  // Escape to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function handleOpen() {
    if (!user) {
      window.location.href = '/?sign_in=1';
      return;
    }
    setOpen(true);
    setError(null);
    setSuccess(null);
  }

  function handleClose() {
    setOpen(false);
    setUsername('');
    setEmail('');
    setNote('');
    setError(null);
    setSuccess(null);
    setMode('username');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasSupabase) return;
    setSubmitting(true);
    setError(null);

    const args: Record<string, string | null> = {
      p_piece_id: pieceId,
      p_note: note.trim() || null,
      p_recipient_username: mode === 'username' ? username.trim() : null,
      p_recipient_email: mode === 'email' ? email.trim() : null,
    };

    const { error: rpcError } = await supabase.rpc('request_contribution', args as never);
    setSubmitting(false);

    if (rpcError) {
      setError(mapError(rpcError.message));
      return;
    }

    const recipient = mode === 'username' ? username.trim() : email.trim();
    setSuccess(`Request sent to ${recipient}.`);
    setTimeout(() => {
      handleClose();
    }, 1800);
  }

  const canSubmit =
    !submitting &&
    ((mode === 'username' && username.trim().length > 0) ||
      (mode === 'email' && email.trim().length > 0));

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={handleOpen}
        aria-haspopup="dialog"
      >
        {triggerLabel}
      </button>

      {open && (
        <div
          className="rcd-backdrop"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Request a contribution"
        >
          <div className="rcd-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="rcd-title">Request a contribution</h2>
            <p className="rcd-subtitle">
              Ask a musician to write a signed contribution on{' '}
              <strong>{pieceTitle}</strong>
              <span className="rcd-subtitle-dim"> ({composerName}).</span>
            </p>
            <p className="rcd-helper">
              They&apos;ll receive a notification and can respond when they&apos;re
              ready.
            </p>

            {isStaff && (
              <fieldset className="rcd-mode">
                <legend>Invite by</legend>
                <label>
                  <input
                    type="radio"
                    name="rcd-mode"
                    value="username"
                    checked={mode === 'username'}
                    onChange={() => setMode('username')}
                  />
                  <span>Username</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="rcd-mode"
                    value="email"
                    checked={mode === 'email'}
                    onChange={() => setMode('email')}
                  />
                  <span>Email</span>
                </label>
              </fieldset>
            )}

            <form onSubmit={handleSubmit}>
              {mode === 'username' && (
                <div className="rcd-field">
                  <label htmlFor="rcd-username">Recipient</label>
                  <input
                    id="rcd-username"
                    ref={firstInputRef}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Irregular Pearl username"
                    autoComplete="off"
                    required
                  />
                </div>
              )}
              {mode === 'email' && (
                <div className="rcd-field">
                  <label htmlFor="rcd-email">Recipient email</label>
                  <input
                    id="rcd-email"
                    ref={firstInputRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="off"
                    required
                  />
                </div>
              )}

              <div className="rcd-field">
                <label htmlFor="rcd-note">Personal note (optional)</label>
                <textarea
                  id="rcd-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 280))}
                  placeholder="One sentence. The recipient will see this with the request. Keep it human."
                  rows={3}
                  maxLength={280}
                />
                <div className="rcd-counter">{note.length}/280</div>
              </div>

              {error && (
                <div className="rcd-error" role="alert">
                  {error}
                </div>
              )}
              {success && (
                <div className="rcd-success" role="status">
                  {success}
                </div>
              )}

              <div className="rcd-actions">
                <button type="button" onClick={handleClose} className="rcd-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={!canSubmit} className="rcd-submit">
                  {submitting ? 'Sending…' : 'Send request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Map structured RPC errors to the design-doc copy table.
function mapError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('sender gate')) {
    return "You can invite others after you've published your first signed contribution. Write a performer's note, practice note, or interpretive school on a piece in the catalog first.";
  }
  if (m.includes('rate limit') && m.includes('recipient')) {
    return "You've already asked this musician to contribute to this piece recently. Try someone else, or wait.";
  }
  if (m.includes('rate limit')) {
    return "You've sent the maximum daily requests. Try tomorrow.";
  }
  if (m.includes('no musician found')) {
    return 'No musician found with that username. Check the spelling, or ask editorial to invite by email.';
  }
  if (m.includes('email invites are staff-only')) {
    return 'Email invites are staff-only.';
  }
  if (m.includes('yourself')) {
    return "You can't send a request to yourself.";
  }
  if (m.includes('piece not found')) {
    return "This piece isn't in the catalog anymore.";
  }
  if (m.includes('unauthenticated')) {
    return 'Sign in first.';
  }
  return message;
}

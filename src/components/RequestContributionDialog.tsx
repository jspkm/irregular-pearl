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

interface UserSuggestion {
  id: string;
  username: string;
  display_name: string;
}

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

  // Username autocomplete state
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeSuggestIdx, setActiveSuggestIdx] = useState(0);
  const usernameFieldRef = useRef<HTMLDivElement>(null);

  // LLM note drafting state
  const [drafting, setDrafting] = useState(false);
  const [hasDrafted, setHasDrafted] = useState(false);

  // Recipient self-hide. If the current viewer is themselves a recipient of
  // an un-cleared contribution_request on this piece, suppress the whole
  // trigger + dialog. Purpose: lessen request cascading — we don't want
  // someone who just received an ask to immediately fan it out to more
  // colleagues. They should respond (publish or dismiss) first.
  const [isRecipient, setIsRecipient] = useState(false);

  useEffect(() => {
    if (!user || !hasSupabase) {
      setIsRecipient(false);
      return;
    }
    let cancelled = false;
    async function check() {
      const { data } = await supabase
        .from('contribution_requests')
        .select('id')
        .eq('piece_id', pieceId)
        .eq('recipient_id', user!.id)
        .is('cleared_at', null)
        .limit(1);
      if (cancelled) return;
      setIsRecipient((data ?? []).length > 0);
    }
    void check();
    const onChanged = () => void check();
    window.addEventListener('notifications:changed', onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('notifications:changed', onChanged);
    };
  }, [user, pieceId]);

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

  // Debounced username autocomplete. Queries public.users by username
  // substring (falling back to display_name match) and excludes the
  // current user. users table is publicly readable so we don't need an
  // RPC. Suggestions close on outside click.
  useEffect(() => {
    if (mode !== 'username' || !hasSupabase) {
      setSuggestions([]);
      return;
    }
    const q = username.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      const pattern = `%${q}%`;
      const query = supabase
        .from('users')
        .select('id, username, display_name')
        .not('username', 'is', null)
        .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
        .limit(6);
      if (user) {
        // Exclude the sender themselves.
        query.neq('id', user.id);
      }
      const { data, error: qErr } = await query;
      if (qErr) return;
      setSuggestions((data ?? []) as UserSuggestion[]);
      setActiveSuggestIdx(0);
    }, 120);
    return () => clearTimeout(handle);
  }, [username, mode, user]);

  // Outside-click closes the suggestion dropdown (not the whole modal).
  useEffect(() => {
    if (!suggestOpen) return;
    const onClick = (e: MouseEvent) => {
      if (usernameFieldRef.current && !usernameFieldRef.current.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [suggestOpen]);

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
    setHasDrafted(false);
  }

  async function handleDraftNote() {
    setDrafting(true);
    setError(null);

    // Resolve recipient first name. Prefer users.display_name's first
    // token; if that's empty (rare for accounts with only an email +
    // username), fall back to the username itself so the greeting is
    // always present.
    let recipientDisplayName = '';
    let recipientFirstName = '';
    if (mode === 'username' && username.trim()) {
      const { data } = await supabase
        .from('users')
        .select('display_name')
        .eq('username', username.trim())
        .maybeSingle();
      const display = ((data as { display_name?: string } | null)?.display_name ?? '').trim();
      recipientDisplayName = display || username.trim();
      const firstToken = display.split(/\s+/)[0] ?? '';
      recipientFirstName = firstToken || username.trim();
    } else if (mode === 'email' && email.trim()) {
      recipientDisplayName = email.trim();
      recipientFirstName = email.trim().split('@')[0] || email.trim();
    }

    // Sender display name — purely informational for the prompt.
    let senderName = '';
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();
      senderName = ((data as { display_name?: string } | null)?.display_name ?? '').trim();
    }

    try {
      const res = await fetch('/api/draft-contribution-note', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          senderName,
          recipientName: recipientDisplayName,
          recipientFirstName,
          pieceTitle,
          composerName,
        }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({ error: 'Drafting failed.' }))) as {
          error?: string;
        };
        setError(errBody.error ?? 'Drafting failed.');
        return;
      }

      const { note: draftedNote } = (await res.json()) as { note: string };
      setNote(draftedNote.slice(0, 280));
      setHasDrafted(true);
    } catch {
      setError('Drafting failed. Check your connection and try again.');
    } finally {
      setDrafting(false);
    }
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

  // Suppress the whole surface if viewer is already a recipient for this
  // piece — prevents request cascading (see state declaration above).
  if (isRecipient) return null;

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
                <div className="rcd-field" ref={usernameFieldRef}>
                  <label htmlFor="rcd-username">Recipient</label>
                  <input
                    id="rcd-username"
                    ref={firstInputRef}
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setSuggestOpen(true);
                    }}
                    onFocus={() => setSuggestOpen(true)}
                    onKeyDown={(e) => {
                      if (!suggestOpen || suggestions.length === 0) return;
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setActiveSuggestIdx((i) => Math.min(i + 1, suggestions.length - 1));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setActiveSuggestIdx((i) => Math.max(i - 1, 0));
                      } else if (e.key === 'Enter' || e.key === 'Tab' || e.key === ' ') {
                        // Accept the active suggestion — which defaults to the
                        // top-most row (activeSuggestIdx starts at 0 on every
                        // query change). Arrow keys still reposition it if
                        // the sender wants a different row.
                        //
                        // Enter / Space: preventDefault so the space/newline
                        // doesn't land in the field. Tab: let default focus
                        // movement proceed after accepting, so focus advances
                        // to the note textarea.
                        const pick = suggestions[activeSuggestIdx];
                        if (!pick) return;
                        setUsername(pick.username);
                        setSuggestOpen(false);
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                        }
                      } else if (e.key === 'Escape') {
                        // Close suggestions without closing the modal.
                        e.stopPropagation();
                        setSuggestOpen(false);
                      }
                    }}
                    placeholder="Irregular Pearl username"
                    autoComplete="off"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={suggestOpen && suggestions.length > 0}
                    aria-controls={suggestOpen ? 'rcd-suggest-list' : undefined}
                    aria-activedescendant={
                      suggestOpen && suggestions.length > 0
                        ? `rcd-suggest-${activeSuggestIdx}`
                        : undefined
                    }
                    required
                  />
                  {suggestOpen && suggestions.length > 0 && (
                    <ul
                      id="rcd-suggest-list"
                      role="listbox"
                      className="rcd-suggest-list"
                    >
                      {suggestions.map((s, i) => (
                        <li
                          key={s.id}
                          id={`rcd-suggest-${i}`}
                          role="option"
                          aria-selected={i === activeSuggestIdx}
                          onMouseDown={(e) => {
                            // mousedown (not click) so the input doesn't blur first
                            e.preventDefault();
                            setUsername(s.username);
                            setSuggestOpen(false);
                            firstInputRef.current?.focus();
                          }}
                          onMouseEnter={() => setActiveSuggestIdx(i)}
                          className={`rcd-suggest-item${i === activeSuggestIdx ? ' is-active' : ''}`}
                        >
                          <span className="rcd-suggest-username">{s.username}</span>
                          <span className="rcd-suggest-display">{s.display_name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
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
                  placeholder="One sentence. The recipient will see this with the request."
                  rows={8}
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
                <button
                  type="button"
                  onClick={handleDraftNote}
                  disabled={
                    drafting ||
                    (mode === 'username' && !username.trim()) ||
                    (mode === 'email' && !email.trim())
                  }
                  className="rcd-draft-link"
                  aria-label={hasDrafted ? 'Rewrite the note' : 'Help me with the note'}
                >
                  {drafting ? (
                    'Drafting…'
                  ) : hasDrafted ? (
                    <>
                      <span aria-hidden="true" className="rcd-draft-icon">
                        ↻
                      </span>
                      Rewrite
                    </>
                  ) : (
                    'Help me with note'
                  )}
                </button>
                <div className="rcd-actions-right">
                  <button type="button" onClick={handleClose} className="rcd-cancel">
                    Cancel
                  </button>
                  <button type="submit" disabled={!canSubmit} className="rcd-submit">
                    {submitting ? 'Sending…' : 'Send request'}
                  </button>
                </div>
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

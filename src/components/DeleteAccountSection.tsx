// Profile -> Security -> Danger zone. Hard-deletes the calling user's
// account via the delete-account edge function, then signs out and redirects
// to the root page.
//
// The cascade chain set in 20260611000000_account_deletion_fk_cascade.sql
// makes the edge function call all that's needed: deleting auth.users
// removes public.users which cascades through every dependent table per
// the policy in PR #86.
//
// UX guard: the Delete button stays disabled until the user types
// "delete" (case-insensitive, exact match).

import { useCallback, useState, type FormEvent } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

type Status =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'error'; message: string };

const CONFIRM_PHRASE = 'delete';

export default function DeleteAccountSection() {
  const { user, loading } = useAuth();
  const [confirmInput, setConfirmInput] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const isConfirmed = confirmInput.trim().toLowerCase() === CONFIRM_PHRASE;

  const submit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!hasSupabase || !user) return;
    if (!isConfirmed) return;
    setStatus({ kind: 'busy' });

    const { error } = await supabase.functions.invoke('delete-account', {
      method: 'POST',
    });
    if (error) {
      setStatus({
        kind: 'error',
        message: 'Could not delete the account. Please try again or contact support.',
      });
      return;
    }

    // The auth row is gone server-side. signOut clears the local session
    // (token + storage); a thrown error here is harmless because we are
    // navigating away regardless.
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore — server-side identity is already gone
    }
    window.location.href = '/';
  }, [user, isConfirmed]);

  if (loading) return null;
  if (!hasSupabase || !user) return null;

  const busy = status.kind === 'busy';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-error">Delete account</h2>
      </div>

      <div className="text-sm text-ink/80 mb-5 space-y-3 leading-relaxed">
        <p>
          Deleting your account is <strong>permanent and cannot be undone</strong>.
          Everything you have published on Irregular Pearl under your byline is
          erased from the site:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Performer's notes, interpretive schools, and signed piece descriptions</li>
          <li>Structural landmarks with their flags and practice notes</li>
          <li>Pending drafts in the approval queue, contribution requests you sent, and your private library data</li>
          <li>Every up/down vote you have cast</li>
          <li>Your profile, email, and account record</li>
        </ul>
        <p>
          Wiki-edited reference data you added (edition entries, recording
          links, pedagogical connections) and your past edits to other
          contributors' content stay in place — but your name is replaced
          with <em>former contributor</em> on every byline and audit trail
          where it appeared. Anonymous search signals stay on the site
          without any link back to your account.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3 max-w-105">
        <label className="ip-signin-field">
          <span>Type <code className="font-mono text-error">delete</code> to confirm</span>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
            aria-describedby="delete-account-confirm-hint"
          />
        </label>

        {status.kind === 'error' && (
          <div className="ip-signin-error" role="alert">{status.message}</div>
        )}

        <div className="ip-signin-actions">
          <button
            type="submit"
            className="ip-signin-btn ip-signin-btn-danger"
            disabled={!isConfirmed || busy}
            aria-disabled={!isConfirmed || busy}
          >
            {busy ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      </form>
    </div>
  );
}

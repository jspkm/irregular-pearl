// Wiki-edit external references. Handles the non-recording external_links
// types (imslp, wikipedia, …). Same end-of-row control pattern as
// EditionsList and MovementsList.

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import {
  fetchExternalLinksForPiece,
  REFERENCE_TYPES,
  type ExternalLink,
} from '../lib/externalLinks';
import { CHANGELOG_REFRESH_EVENT } from './ChangeLog';

interface Props {
  pieceId: string;
  initialLinks: ExternalLink[];
}

type Busy = { kind: 'idle' } | { kind: 'working'; id?: string } | { kind: 'error'; message: string };

export default function ExternalRefsList({ pieceId, initialLinks }: Props) {
  const { user } = useAuth();
  const [links, setLinks] = useState<ExternalLink[]>(initialLinks);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [busy, setBusy] = useState<Busy>({ kind: 'idle' });

  const broadcastChangelog = useCallback(() => {
    window.dispatchEvent(new CustomEvent(CHANGELOG_REFRESH_EVENT, { detail: { pieceId } }));
  }, [pieceId]);

  const refetch = useCallback(async () => {
    const next = await fetchExternalLinksForPiece(pieceId);
    setLinks(next.filter((l) => (REFERENCE_TYPES as readonly string[]).includes(l.type)));
    broadcastChangelog();
  }, [pieceId, broadcastChangelog]);

  const requireAuth = useCallback(() => {
    if (!user) { setSignInOpen(true); return false; }
    return true;
  }, [user]);

  const handleSwap = useCallback(async (i: number, dir: 'up' | 'down') => {
    if (!requireAuth()) return;
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= links.length) return;
    const a = links[i], b = links[j];
    setBusy({ kind: 'working', id: a.id });
    const { error } = await supabase.rpc('swap_external_link_ordinals', { p_id_a: a.id, p_id_b: b.id });
    if (error) {
      setBusy({ kind: 'error', message: pretty(error.message, 'Reorder failed') });
      return;
    }
    await refetch();
    setBusy({ kind: 'idle' });
  }, [links, refetch, requireAuth]);

  const handleDelete = useCallback(async (id: string) => {
    if (!requireAuth()) return;
    setBusy({ kind: 'working', id });
    const { error } = await supabase.rpc('delete_external_link', { p_id: id });
    if (error) {
      setBusy({ kind: 'error', message: pretty(error.message, 'Delete failed') });
      return;
    }
    setConfirmDeleteId(null);
    await refetch();
    setBusy({ kind: 'idle' });
  }, [refetch, requireAuth]);

  return (
    <>
      {links.length === 0 ? (
        <p className="empty-state">No external references yet.</p>
      ) : (
        <ul className="ext-refs">
          {links.map((l, i) => {
            const isFirst = i === 0;
            const isLast = i === links.length - 1;
            const isConfirming = confirmDeleteId === l.id;
            const isEditing = editingId === l.id;
            const rowWorking = busy.kind === 'working' && busy.id === l.id;

            if (isEditing) {
              return (
                <li key={l.id} className="ext-ref-editing">
                  <ExternalLinkEditForm
                    initial={l}
                    busy={rowWorking}
                    onCancel={() => setEditingId(null)}
                    onSave={async (f) => {
                      setBusy({ kind: 'working', id: l.id });
                      const { error } = await supabase.rpc('update_external_link', {
                        p_id: l.id,
                        p_type: f.type,
                        p_url: f.url,
                        p_label: f.label,
                      });
                      if (error) {
                        setBusy({ kind: 'error', message: pretty(error.message, 'Save failed') });
                        return;
                      }
                      setEditingId(null);
                      await refetch();
                      setBusy({ kind: 'idle' });
                    }}
                  />
                </li>
              );
            }

            return (
              <li key={l.id} className="ext-ref-row">
                <a className="ext-ref" href={l.url} target="_blank" rel="noopener">{l.label}</a>
                <div className="ed-ctrls" aria-label={`Controls for ${l.label}`}>
                  <button type="button" className="ed-ctrl" aria-label="Move up"
                    disabled={isFirst || rowWorking} onClick={() => handleSwap(i, 'up')}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button type="button" className="ed-ctrl" aria-label="Move down"
                    disabled={isLast || rowWorking} onClick={() => handleSwap(i, 'down')}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button type="button" className="ed-ctrl" aria-label={`Edit ${l.label}`}
                    disabled={rowWorking} onClick={() => { if (!requireAuth()) return; setEditingId(l.id); }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {isConfirming ? (
                    <span className="ed-confirm" role="alertdialog">
                      Delete?
                      <button type="button" className="ed-confirm-yes" onClick={() => handleDelete(l.id)} disabled={rowWorking}>Yes</button>
                      <button type="button" className="ed-confirm-no" onClick={() => setConfirmDeleteId(null)}>No</button>
                    </span>
                  ) : (
                    <button type="button" className="ed-ctrl ed-ctrl-delete" aria-label={`Delete ${l.label}`}
                      disabled={rowWorking} onClick={() => { if (!requireAuth()) return; setConfirmDeleteId(l.id); }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" className="mvmt-add" onClick={() => { if (!requireAuth()) return; setAddOpen(true); }}>
        + Add reference
      </button>

      {busy.kind === 'error' && (
        <div className="mvmt-toast" role="alert">
          {busy.message}
          <button type="button" className="mvmt-toast-dismiss" onClick={() => setBusy({ kind: 'idle' })}>Dismiss</button>
        </div>
      )}

      {signInOpen && <SignInPrompt onClose={() => setSignInOpen(false)} kind="reference" />}
      {addOpen && (
        <ExternalLinkAddModal
          pieceId={pieceId}
          onCancel={() => setAddOpen(false)}
          onCreated={async () => { setAddOpen(false); await refetch(); }}
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------------

function pretty(msg: string, fallback: string): string {
  if (msg.includes('rate limit')) return 'Too many edits — wait a moment.';
  return `${fallback}: ${msg}`;
}

function SignInPrompt({ onClose, kind }: { onClose: () => void; kind: string }) {
  const handleSignIn = useCallback(async () => {
    if (!hasSupabase) return;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
  }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <>
      <div className="movement-edit-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="movement-edit-modal movement-edit-signin" role="dialog" aria-modal="true" aria-labelledby="ext-signin-title">
        <h2 id="ext-signin-title" className="movement-edit-title">Sign in to edit</h2>
        <p className="movement-edit-signin-body">
          {kind} entries are wiki-edit — any registered user can add, revise, reorder, or remove them.
          Sign in or create an account to make your change.
        </p>
        <div className="movement-edit-actions">
          <button type="button" className="movement-edit-button movement-edit-button-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="movement-edit-button movement-edit-button-primary" onClick={handleSignIn} autoFocus>
            Sign in / Register
          </button>
        </div>
      </div>
    </>
  );
}

interface Fields { type: string; url: string; label: string }

function ExternalLinkEditForm({ initial, busy, onCancel, onSave }: {
  initial: ExternalLink;
  busy: boolean;
  onCancel: () => void;
  onSave: (f: Fields) => void | Promise<void>;
}) {
  const [f, setF] = useState<Fields>({ type: initial.type, url: initial.url, label: initial.label });
  return (
    <div className="ed-editing">
      <ExternalLinkFields fields={f} onChange={setF} />
      <div className="movement-edit-actions">
        <button type="button" className="movement-edit-button movement-edit-button-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="button" className="movement-edit-button movement-edit-button-primary" onClick={() => onSave(f)} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function ExternalLinkAddModal({ pieceId, onCancel, onCreated }: {
  pieceId: string;
  onCancel: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [f, setF] = useState<Fields>({ type: 'imslp', url: '', label: '' });
  const [state, setState] = useState<{ kind: 'idle' } | { kind: 'saving' } | { kind: 'error'; message: string }>({ kind: 'idle' });
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onCancel]);

  const save = useCallback(async () => {
    if (f.url.trim().length < 1) { setState({ kind: 'error', message: 'URL is required.' }); return; }
    if (f.label.trim().length < 1) { setState({ kind: 'error', message: 'Label is required.' }); return; }
    setState({ kind: 'saving' });
    const { error } = await supabase.rpc('create_external_link', {
      p_piece_id: pieceId, p_type: f.type, p_url: f.url.trim(), p_label: f.label.trim(),
    });
    if (error) {
      setState({ kind: 'error', message: pretty(error.message, 'Save failed') });
      return;
    }
    await onCreated();
  }, [f, pieceId, onCreated]);

  return (
    <>
      <div className="movement-edit-backdrop" onClick={onCancel} aria-hidden="true" />
      <div ref={modalRef} className="movement-edit-modal" role="dialog" aria-modal="true" aria-labelledby="ext-add-title">
        <h2 id="ext-add-title" className="movement-edit-title">Add reference</h2>
        <ExternalLinkFields fields={f} onChange={setF} autoFocusFirst />
        {state.kind === 'error' && <div className="movement-edit-error" role="alert">{state.message}</div>}
        <div className="movement-edit-actions">
          <button type="button" className="movement-edit-button movement-edit-button-ghost" onClick={onCancel} disabled={state.kind === 'saving'}>Cancel</button>
          <button type="button" className="movement-edit-button movement-edit-button-primary" onClick={save} disabled={state.kind === 'saving'}>
            {state.kind === 'saving' ? 'Saving…' : 'Add reference'}
          </button>
        </div>
      </div>
    </>
  );
}

function ExternalLinkFields({ fields, onChange, autoFocusFirst }: {
  fields: Fields;
  onChange: (f: Fields) => void;
  autoFocusFirst?: boolean;
}) {
  return (
    <>
      <label className="movement-edit-field">
        <span>Type</span>
        <select value={fields.type} onChange={(e) => onChange({ ...fields, type: e.target.value })}>
          {REFERENCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <label className="movement-edit-field">
        <span>Label</span>
        <input
          autoFocus={autoFocusFirst}
          type="text"
          value={fields.label}
          onChange={(e) => onChange({ ...fields, label: e.target.value })}
          maxLength={200}
          required
          placeholder="e.g. IMSLP — 12 editions available"
        />
      </label>
      <label className="movement-edit-field">
        <span>URL</span>
        <input type="url" value={fields.url} onChange={(e) => onChange({ ...fields, url: e.target.value })} placeholder="https://…" required />
      </label>
    </>
  );
}

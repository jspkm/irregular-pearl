// Wiki-edit recordings list. Same end-of-row controls as ExternalRefsList /
// EditionsList / MovementsList, layered on top of the existing collapse-to-play
// disclosure pattern.
//
// Header row layout:  [chevron] [label] [source-chip] [↑ ↓ ✎ ×]
// The toggle button covers chevron+label+source-chip only. The control cluster
// is a sibling and stops click propagation so editing controls do not also
// open/close the player. Edit/delete/add operate on the same external_links
// table that backs References — `update_external_link`, `delete_external_link`,
// `swap_external_link_ordinals`, `create_external_link`. Filtered to
// RECORDING_TYPES at render so the surface only shows what it owns.
//
// Single-open model preserved: opening one row closes any other open row.

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRequireAuth } from '../lib/useRequireAuth';
import {
  fetchExternalLinksForPiece,
  recordingEmbedUrl,
  RECORDING_TYPES,
  type ExternalLink,
} from '../lib/externalLinks';
import { CHANGELOG_REFRESH_EVENT } from './ChangeLog';
import SignInPanel from './SignInPanel';

interface Props {
  pieceId: string;
  initialLinks: ExternalLink[];
}

type Busy = { kind: 'idle' } | { kind: 'working'; id?: string } | { kind: 'error'; message: string };

export default function RecordingsList({ pieceId, initialLinks }: Props) {
  const {
    signInOpen,
    onClose: signInOnClose,
    onSignedIn: signInOnSignedIn,
    gate,
  } = useRequireAuth();
  const [links, setLinks] = useState<ExternalLink[]>(initialLinks);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState<Busy>({ kind: 'idle' });

  const broadcastChangelog = useCallback(() => {
    window.dispatchEvent(new CustomEvent(CHANGELOG_REFRESH_EVENT, { detail: { pieceId } }));
  }, [pieceId]);

  const refetch = useCallback(async () => {
    const next = await fetchExternalLinksForPiece(pieceId);
    setLinks(next.filter((l) => (RECORDING_TYPES as readonly string[]).includes(l.type)));
    broadcastChangelog();
  }, [pieceId, broadcastChangelog]);

  const handleSwap = useCallback((i: number, dir: 'up' | 'down') => {
    gate(() => void (async () => {
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
    })());
  }, [links, refetch, gate]);

  const handleDelete = useCallback((id: string) => {
    gate(() => void (async () => {
      setBusy({ kind: 'working', id });
      const { error } = await supabase.rpc('delete_external_link', { p_id: id });
      if (error) {
        setBusy({ kind: 'error', message: pretty(error.message, 'Delete failed') });
        return;
      }
      setConfirmDeleteId(null);
      if (openId === id) setOpenId(null);
      await refetch();
      setBusy({ kind: 'idle' });
    })());
  }, [openId, refetch, gate]);

  return (
    <>
      {links.length > 0 && (
        <ul className="rec-list">
          {links.map((r, i) => {
            const isFirst = i === 0;
            const isLast = i === links.length - 1;
            const isOpen = openId === r.id;
            const isEditing = editingId === r.id;
            const isConfirming = confirmDeleteId === r.id;
            const rowWorking = busy.kind === 'working' && busy.id === r.id;
            const embedUrl = recordingEmbedUrl(r.type, r.url);

            if (isEditing) {
              return (
                <li key={r.id} className="rec-item rec-item-editing">
                  <RecordingEditForm
                    initial={r}
                    busy={rowWorking}
                    onCancel={() => setEditingId(null)}
                    onSave={async (f) => {
                      setBusy({ kind: 'working', id: r.id });
                      const { error } = await supabase.rpc('update_external_link', {
                        p_id: r.id,
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
              <li className={`rec-item${isOpen ? ' is-open' : ''}`} key={r.id}>
                <div className="rec-row">
                  <button
                    type="button"
                    className="rec-header"
                    aria-expanded={isOpen}
                    aria-controls={`rec-body-${r.id}`}
                    onClick={() => setOpenId(isOpen ? null : r.id)}
                  >
                    <span className="rec-chevron" aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
                    <span className="rec-label">{r.label}</span>
                    <span className="rec-source">{r.type.replace('_', ' ')}</span>
                  </button>
                  <div className="ed-ctrls" aria-label={`Controls for ${r.label}`} onClick={(e) => e.stopPropagation()}>
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
                    <button type="button" className="ed-ctrl" aria-label={`Edit ${r.label}`}
                      disabled={rowWorking} onClick={() => gate(() => { setEditingId(r.id); if (isOpen) setOpenId(null); })}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {isConfirming ? (
                      <span className="ed-confirm" role="alertdialog">
                        Delete?
                        <button type="button" className="ed-confirm-yes" onClick={() => handleDelete(r.id)} disabled={rowWorking}>Yes</button>
                        <button type="button" className="ed-confirm-no" onClick={() => setConfirmDeleteId(null)}>No</button>
                      </span>
                    ) : (
                      <button type="button" className="ed-ctrl ed-ctrl-delete" aria-label={`Delete ${r.label}`}
                        disabled={rowWorking} onClick={() => gate(() => setConfirmDeleteId(r.id))}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div id={`rec-body-${r.id}`} className="rec-body">
                    {embedUrl ? (
                      <div className={`rec-frame rec-frame-${r.type}`}>
                        <iframe
                          src={embedUrl}
                          title={r.label}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      </div>
                    ) : (
                      <p className="rec-fallback">
                        <a className="ext-ref" href={r.url} target="_blank" rel="noopener">
                          Open on source
                        </a>
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" className="mvmt-add" onClick={() => gate(() => setAddOpen(true))}>
        + Add recording
      </button>

      {busy.kind === 'error' && (
        <div className="mvmt-toast" role="alert">
          {busy.message}
          <button type="button" className="mvmt-toast-dismiss" onClick={() => setBusy({ kind: 'idle' })}>Dismiss</button>
        </div>
      )}

      {signInOpen && (
        <SignInPanel
          onClose={signInOnClose}
          onSignedIn={signInOnSignedIn}
          title="Sign in to edit"
          body={
            <>
              Recording entries are wiki-edit — any registered user can add, revise, reorder, or remove them.
              Sign in or create an account to make your change.
            </>
          }
        />
      )}
      {addOpen && (
        <RecordingAddModal
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

interface Fields { type: string; url: string; label: string }

function RecordingEditForm({ initial, busy, onCancel, onSave }: {
  initial: ExternalLink;
  busy: boolean;
  onCancel: () => void;
  onSave: (f: Fields) => void | Promise<void>;
}) {
  const [f, setF] = useState<Fields>({ type: initial.type, url: initial.url, label: initial.label });
  return (
    <div className="ed-editing">
      <RecordingFields fields={f} onChange={setF} />
      <div className="movement-edit-actions">
        <button type="button" className="movement-edit-button movement-edit-button-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="button" className="movement-edit-button movement-edit-button-primary" onClick={() => onSave(f)} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function RecordingAddModal({ pieceId, onCancel, onCreated }: {
  pieceId: string;
  onCancel: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [f, setF] = useState<Fields>({ type: 'youtube', url: '', label: '' });
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
      <div ref={modalRef} className="movement-edit-modal" role="dialog" aria-modal="true" aria-labelledby="rec-add-title">
        <h2 id="rec-add-title" className="movement-edit-title">Add recording</h2>
        <RecordingFields fields={f} onChange={setF} autoFocusFirst />
        {state.kind === 'error' && <div className="movement-edit-error" role="alert">{state.message}</div>}
        <div className="movement-edit-actions">
          <button type="button" className="movement-edit-button movement-edit-button-ghost" onClick={onCancel} disabled={state.kind === 'saving'}>Cancel</button>
          <button type="button" className="movement-edit-button movement-edit-button-primary" onClick={save} disabled={state.kind === 'saving'}>
            {state.kind === 'saving' ? 'Saving…' : 'Add recording'}
          </button>
        </div>
      </div>
    </>
  );
}

function RecordingFields({ fields, onChange, autoFocusFirst }: {
  fields: Fields;
  onChange: (f: Fields) => void;
  autoFocusFirst?: boolean;
}) {
  return (
    <>
      <label className="movement-edit-field">
        <span>Source</span>
        <select value={fields.type} onChange={(e) => onChange({ ...fields, type: e.target.value })}>
          {RECORDING_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
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
          placeholder="e.g. Pablo Casals — Prélude (historic)"
        />
      </label>
      <label className="movement-edit-field">
        <span>URL</span>
        <input type="url" value={fields.url} onChange={(e) => onChange({ ...fields, url: e.target.value })} placeholder="https://…" required />
      </label>
    </>
  );
}

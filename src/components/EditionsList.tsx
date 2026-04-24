// Wiki-edit editions: any signed-in user can add, edit, reorder, soft-delete.
// Anon users see the affordances; clicking opens a shared sign-in prompt
// (per memory: edit affordance at end of row, sign-in prompt for anon).
//
// Pattern mirrors MovementsList: end-of-row ↑/↓/pencil/× controls, inline
// "Delete? Yes/No" confirmation, "+ Add edition" modal. Refetches on every
// mutation so state stays consistent with DB order.

import { useCallback, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { fetchEditionsForPiece, type Edition } from '../lib/editions';
import { CHANGELOG_REFRESH_EVENT } from './ChangeLog';
import SignInPanel from './SignInPanel';
import { useRequireAuth } from '../lib/useRequireAuth';

interface Props {
  pieceId: string;
  initialEditions: Edition[];
}

const TYPE_OPTIONS = ['urtext', 'scholarly', 'performer', 'facsimile', 'critical', 'practical'];

type Busy = { kind: 'idle' } | { kind: 'working'; id?: string } | { kind: 'error'; message: string };

export default function EditionsList({ pieceId, initialEditions }: Props) {
  const {
    signInOpen,
    onClose: signInOnClose,
    onSignedIn: signInOnSignedIn,
    gate,
  } = useRequireAuth();
  const [editions, setEditions] = useState<Edition[]>(initialEditions);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState<Busy>({ kind: 'idle' });

  const broadcastChangelog = useCallback(() => {
    window.dispatchEvent(new CustomEvent(CHANGELOG_REFRESH_EVENT, { detail: { pieceId } }));
  }, [pieceId]);

  const refetch = useCallback(async () => {
    const next = await fetchEditionsForPiece(pieceId);
    setEditions(next);
    broadcastChangelog();
  }, [pieceId, broadcastChangelog]);

  const handleSwap = useCallback((i: number, dir: 'up' | 'down') => {
    gate(() => void (async () => {
      const j = dir === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= editions.length) return;
      const a = editions[i], b = editions[j];
      setBusy({ kind: 'working', id: a.id });
      const { error } = await supabase.rpc('swap_edition_ordinals', { p_id_a: a.id, p_id_b: b.id });
      if (error) {
        setBusy({ kind: 'error', message: prettyError(error.message, 'Reorder failed') });
        return;
      }
      await refetch();
      setBusy({ kind: 'idle' });
    })());
  }, [editions, refetch, gate]);

  const handleDelete = useCallback((id: string) => {
    gate(() => void (async () => {
      setBusy({ kind: 'working', id });
      const { error } = await supabase.rpc('delete_edition', { p_id: id });
      if (error) {
        setBusy({ kind: 'error', message: prettyError(error.message, 'Delete failed') });
        return;
      }
      setConfirmDeleteId(null);
      await refetch();
      setBusy({ kind: 'idle' });
    })());
  }, [refetch, gate]);

  return (
    <>
      {editions.length > 0 && (
        <div className="editions">
          {editions.map((e, i) => {
            const isFirst = i === 0;
            const isLast = i === editions.length - 1;
            const isConfirming = confirmDeleteId === e.id;
            const isEditing = editingId === e.id;
            const rowWorking = busy.kind === 'working' && busy.id === e.id;

            if (isEditing) {
              return (
                <EditionEditForm
                  key={e.id}
                  initial={e}
                  busy={rowWorking}
                  onCancel={() => setEditingId(null)}
                  onSave={async (fields) => {
                    setBusy({ kind: 'working', id: e.id });
                    const { error } = await supabase.rpc('update_edition', {
                      p_id: e.id,
                      p_publisher: fields.publisher,
                      p_editor: fields.editor,
                      p_year: fields.year ?? undefined,
                      p_description: fields.description,
                      p_type: fields.type ?? undefined,
                      p_url: fields.url ?? undefined,
                    });
                    if (error) {
                      setBusy({ kind: 'error', message: prettyError(error.message, 'Save failed') });
                      return;
                    }
                    setEditingId(null);
                    await refetch();
                    setBusy({ kind: 'idle' });
                  }}
                />
              );
            }

            const openEdition = () => {
              if (e.url) window.open(e.url, '_blank', 'noopener');
            };
            return (
              <div
                key={e.id}
                className={`ed-row ed${e.url ? ' ed-clickable' : ''}`}
                role={e.url ? 'link' : undefined}
                tabIndex={e.url ? 0 : undefined}
                aria-label={e.url ? `Open ${e.publisher}` : undefined}
                onClick={(ev) => {
                  if (!e.url) return;
                  if ((ev.target as HTMLElement).closest('.ed-ctrls, button, a, input, select, textarea')) return;
                  openEdition();
                }}
                onKeyDown={(ev) => {
                  if (!e.url) return;
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    if ((ev.target as HTMLElement).closest('.ed-ctrls, button, a, input, select, textarea')) return;
                    ev.preventDefault();
                    openEdition();
                  }
                }}
              >
                <div className="ed-head">
                  <h3>{e.publisher}</h3>
                  <div
                    className="ed-ctrls"
                    aria-label={`Controls for ${e.publisher}`}
                  >
                  <button type="button" className="ed-ctrl" aria-label={`Move ${e.publisher} up`}
                    disabled={isFirst || rowWorking} onClick={() => handleSwap(i, 'up')}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button type="button" className="ed-ctrl" aria-label={`Move ${e.publisher} down`}
                    disabled={isLast || rowWorking} onClick={() => handleSwap(i, 'down')}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button type="button" className="ed-ctrl" aria-label={`Edit ${e.publisher}`}
                    disabled={rowWorking} onClick={() => gate(() => setEditingId(e.id))}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {isConfirming ? (
                    <span className="ed-confirm" role="alertdialog">
                      Delete?
                      <button type="button" className="ed-confirm-yes" onClick={() => handleDelete(e.id)} disabled={rowWorking}>Yes</button>
                      <button type="button" className="ed-confirm-no" onClick={() => setConfirmDeleteId(null)}>No</button>
                    </span>
                  ) : (
                    <button type="button" className="ed-ctrl ed-ctrl-delete" aria-label={`Delete ${e.publisher}`}
                      disabled={rowWorking} onClick={() => gate(() => setConfirmDeleteId(e.id))}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                  </div>
                  {e.type && (
                    <span className="type-chip">{e.type}</span>
                  )}
                </div>
                <div className="meta">{e.editor}{e.year ? ` · ${e.year}` : ''}</div>
                {e.description && <p className="desc">{e.description}</p>}
                {e.url && <span className="ed-external-arrow" aria-hidden="true">↗</span>}
              </div>
            );
          })}
        </div>
      )}

      <button type="button" className="mvmt-add" onClick={() => gate(() => setAddOpen(true))}>
        + Add edition
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
              Editions are wiki-edit — any registered user can add, revise, reorder, or remove them.
              Sign in or create an account to make your change.
            </>
          }
        />
      )}
      {addOpen && (
        <EditionAddModal
          pieceId={pieceId}
          onCancel={() => setAddOpen(false)}
          onCreated={async () => { setAddOpen(false); await refetch(); }}
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------------

function prettyError(msg: string, fallback: string): string {
  if (msg.includes('rate limit')) return 'Too many edits — wait a moment.';
  return `${fallback}: ${msg}`;
}

// ----------------------------------------------------------------------------
// EditForm: inline editor for an existing edition row.
// AddModal: modal editor for a new edition.
// Both use the same field set.

interface Fields {
  publisher: string;
  editor: string;
  year: number | null;
  description: string;
  type: string | null;
  url: string | null;
}

function EditionEditForm({ initial, busy, onCancel, onSave }: {
  initial: Edition;
  busy: boolean;
  onCancel: () => void;
  onSave: (f: Fields) => void | Promise<void>;
}) {
  const [f, setF] = useState<Fields>({
    publisher: initial.publisher,
    editor: initial.editor,
    year: initial.year,
    description: initial.description,
    type: initial.type,
    url: initial.url,
  });
  return (
    <div className="ed ed-editing">
      <EditionFields fields={f} onChange={setF} />
      <div className="movement-edit-actions">
        <button type="button" className="movement-edit-button movement-edit-button-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="button" className="movement-edit-button movement-edit-button-primary" onClick={() => onSave(f)} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function EditionAddModal({ pieceId, onCancel, onCreated }: {
  pieceId: string;
  onCancel: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [f, setF] = useState<Fields>({
    publisher: '', editor: '', year: null, description: '', type: null, url: null,
  });
  const [state, setState] = useState<{ kind: 'idle' } | { kind: 'saving' } | { kind: 'error'; message: string }>({ kind: 'idle' });
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onCancel]);

  const save = useCallback(async () => {
    if (f.publisher.trim().length < 1) { setState({ kind: 'error', message: 'Publisher is required.' }); return; }
    setState({ kind: 'saving' });
    const { error } = await supabase.rpc('create_edition', {
      p_piece_id: pieceId,
      p_publisher: f.publisher.trim(),
      p_editor: f.editor.trim() || '',
      p_year: f.year ?? undefined,
      p_description: f.description.trim() || '',
      p_type: f.type ?? undefined,
      p_url: f.url?.trim() ?? undefined,
    });
    if (error) {
      setState({ kind: 'error', message: prettyError(error.message, 'Save failed') });
      return;
    }
    await onCreated();
  }, [f, pieceId, onCreated]);

  return (
    <>
      <div className="movement-edit-backdrop" onClick={onCancel} aria-hidden="true" />
      <div ref={modalRef} className="movement-edit-modal" role="dialog" aria-modal="true" aria-labelledby="ed-add-title">
        <h2 id="ed-add-title" className="movement-edit-title">Add edition</h2>
        <EditionFields fields={f} onChange={setF} autoFocusFirst />
        {state.kind === 'error' && <div className="movement-edit-error" role="alert">{state.message}</div>}
        <div className="movement-edit-actions">
          <button type="button" className="movement-edit-button movement-edit-button-ghost" onClick={onCancel} disabled={state.kind === 'saving'}>Cancel</button>
          <button type="button" className="movement-edit-button movement-edit-button-primary" onClick={save} disabled={state.kind === 'saving'}>
            {state.kind === 'saving' ? 'Saving…' : 'Add edition'}
          </button>
        </div>
      </div>
    </>
  );
}

function EditionFields({ fields, onChange, autoFocusFirst }: {
  fields: Fields;
  onChange: (f: Fields) => void;
  autoFocusFirst?: boolean;
}) {
  return (
    <>
      <label className="movement-edit-field">
        <span>Publisher</span>
        <input
          autoFocus={autoFocusFirst}
          type="text"
          value={fields.publisher}
          onChange={(e) => onChange({ ...fields, publisher: e.target.value })}
          maxLength={200}
          required
        />
      </label>
      <div className="movement-edit-row">
        <label className="movement-edit-field">
          <span>Editor</span>
          <input type="text" value={fields.editor} onChange={(e) => onChange({ ...fields, editor: e.target.value })} maxLength={200} />
        </label>
        <label className="movement-edit-field">
          <span>Year</span>
          <input type="number" value={fields.year ?? ''} onChange={(e) => onChange({ ...fields, year: e.target.value ? Number(e.target.value) : null })} />
        </label>
        <label className="movement-edit-field">
          <span>Type</span>
          <select value={fields.type ?? ''} onChange={(e) => onChange({ ...fields, type: e.target.value || null })}>
            <option value="">—</option>
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>
      <label className="movement-edit-field">
        <span>URL (optional)</span>
        <input type="url" value={fields.url ?? ''} onChange={(e) => onChange({ ...fields, url: e.target.value || null })} placeholder="https://…" />
      </label>
      <label className="movement-edit-field">
        <span>Description (optional)</span>
        <input type="text" value={fields.description} onChange={(e) => onChange({ ...fields, description: e.target.value })} maxLength={500} />
      </label>
    </>
  );
}

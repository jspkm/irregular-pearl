// Pedagogical-arc surface. Two subsections per piece — "Prepare with"
// (study these first) and "Natural next" (where to go after) — each a
// list of related pieces with an optional one-line note. Wiki-edit pattern
// from movements / editions / external refs / recordings: any signed-in
// user can add, edit, reorder within section, or remove. Anon clicks
// open the shared sign-in panel.
//
// Backing schema + RPCs shipped in 20260509000000_pedagogical_arc.sql:
//   create_pedagogical_connection / update_pedagogical_connection /
//   delete_pedagogical_connection / swap_pedagogical_ordinals.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import {
  fetchPedagogicalConnections,
  type PedagogicalConnection,
  type PedagogicalKind,
  type PieceOption,
} from '../lib/pedagogical';
import { CHANGELOG_REFRESH_EVENT } from './ChangeLog';
import PiecePicker from './PiecePicker';
import SignInPanel from './SignInPanel';

interface Props {
  pieceId: string;
  initialConnections: PedagogicalConnection[];
  pieceOptions: PieceOption[];
}

type Busy = { kind: 'idle' } | { kind: 'working'; id?: string } | { kind: 'error'; message: string };

const KIND_LABELS: Record<PedagogicalKind, string> = {
  prepare_with: 'Prepare with',
  natural_next: 'Natural next',
};

export default function PedagogicalArcList({ pieceId, initialConnections, pieceOptions }: Props) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<PedagogicalConnection[]>(initialConnections);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [addOpenKind, setAddOpenKind] = useState<PedagogicalKind | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [busy, setBusy] = useState<Busy>({ kind: 'idle' });

  const broadcastChangelog = useCallback(() => {
    window.dispatchEvent(new CustomEvent(CHANGELOG_REFRESH_EVENT, { detail: { pieceId } }));
  }, [pieceId]);

  const refetch = useCallback(async () => {
    setConnections(await fetchPedagogicalConnections(pieceId));
    broadcastChangelog();
  }, [pieceId, broadcastChangelog]);

  const requireAuth = useCallback(() => {
    if (!user) { setSignInOpen(true); return false; }
    return true;
  }, [user]);

  const grouped = useMemo(() => {
    const prepare: PedagogicalConnection[] = [];
    const next: PedagogicalConnection[] = [];
    for (const c of connections) {
      (c.kind === 'prepare_with' ? prepare : next).push(c);
    }
    return { prepare_with: prepare, natural_next: next };
  }, [connections]);

  const usedIds = useMemo(() => {
    const s = new Set<string>([pieceId]);
    for (const c of connections) s.add(c.relatedPieceId);
    return s;
  }, [connections, pieceId]);

  const handleSwap = useCallback(async (kind: PedagogicalKind, i: number, dir: 'up' | 'down') => {
    if (!requireAuth()) return;
    const list = grouped[kind];
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= list.length) return;
    const a = list[i], b = list[j];
    setBusy({ kind: 'working', id: a.id });
    const { error } = await supabase.rpc('swap_pedagogical_ordinals', { p_id_a: a.id, p_id_b: b.id });
    if (error) {
      setBusy({ kind: 'error', message: pretty(error.message, 'Reorder failed') });
      return;
    }
    await refetch();
    setBusy({ kind: 'idle' });
  }, [grouped, refetch, requireAuth]);

  const handleDelete = useCallback(async (id: string) => {
    if (!requireAuth()) return;
    setBusy({ kind: 'working', id });
    const { error } = await supabase.rpc('delete_pedagogical_connection', { p_id: id });
    if (error) {
      setBusy({ kind: 'error', message: pretty(error.message, 'Delete failed') });
      return;
    }
    setConfirmDeleteId(null);
    await refetch();
    setBusy({ kind: 'idle' });
  }, [refetch, requireAuth]);

  const isEmpty = connections.length === 0;

  return (
    <>
      {isEmpty ? (
        <p className="empty-state">Prepare-with and natural-next connections not yet curated.</p>
      ) : null}

      {(['prepare_with', 'natural_next'] as PedagogicalKind[]).map((kind) => {
        const list = grouped[kind];
        if (list.length === 0 && isEmpty) return null;
        return (
          <div key={kind} className="ped-section">
            <h3 className="ped-section-title">{KIND_LABELS[kind]}</h3>
            {list.length === 0 ? (
              <p className="empty-state ped-section-empty">No {KIND_LABELS[kind].toLowerCase()} connections yet.</p>
            ) : (
              <ul className="ped-list">
                {list.map((c, i) => {
                  const isFirst = i === 0;
                  const isLast = i === list.length - 1;
                  const isEditing = editingId === c.id;
                  const isConfirming = confirmDeleteId === c.id;
                  const rowWorking = busy.kind === 'working' && busy.id === c.id;

                  if (isEditing) {
                    return (
                      <li key={c.id} className="ped-row ped-row-editing">
                        <PedagogicalEditForm
                          initial={c}
                          pieceOptions={pieceOptions}
                          excludeIds={Array.from(usedIds).filter((id) => id !== c.relatedPieceId)}
                          busy={rowWorking}
                          onCancel={() => setEditingId(null)}
                          onSave={async (f) => {
                            setBusy({ kind: 'working', id: c.id });
                            const { error } = await supabase.rpc('update_pedagogical_connection', {
                              p_id: c.id,
                              p_related_piece_id: f.relatedPieceId,
                              p_kind: c.kind,
                              p_note: f.note ?? null,
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
                    <li key={c.id} className="ped-row">
                      <a className="ped-link" href={`/piece/${c.relatedPieceId}`}>
                        <span className="ped-link-arrow" aria-hidden="true">→</span>
                        <span className="ped-link-title">{c.relatedTitle}</span>
                        <span className="ped-link-meta">
                          {c.relatedComposer}
                          {c.relatedCatalogNumber ? ` · ${c.relatedCatalogNumber}` : ''}
                        </span>
                      </a>
                      {c.note ? <p className="ped-note">{c.note}</p> : null}
                      <div className="ed-ctrls" aria-label={`Controls for ${c.relatedTitle}`}>
                        <button type="button" className="ed-ctrl" aria-label="Move up"
                          disabled={isFirst || rowWorking} onClick={() => handleSwap(kind, i, 'up')}>
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button type="button" className="ed-ctrl" aria-label="Move down"
                          disabled={isLast || rowWorking} onClick={() => handleSwap(kind, i, 'down')}>
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button type="button" className="ed-ctrl" aria-label={`Edit ${c.relatedTitle}`}
                          disabled={rowWorking} onClick={() => { if (!requireAuth()) return; setEditingId(c.id); }}>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                          </svg>
                        </button>
                        {isConfirming ? (
                          <span className="ed-confirm" role="alertdialog">
                            Delete?
                            <button type="button" className="ed-confirm-yes" onClick={() => handleDelete(c.id)} disabled={rowWorking}>Yes</button>
                            <button type="button" className="ed-confirm-no" onClick={() => setConfirmDeleteId(null)}>No</button>
                          </span>
                        ) : (
                          <button type="button" className="ed-ctrl ed-ctrl-delete" aria-label={`Delete ${c.relatedTitle}`}
                            disabled={rowWorking} onClick={() => { if (!requireAuth()) return; setConfirmDeleteId(c.id); }}>
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
            <button type="button" className="mvmt-add ped-add" onClick={() => { if (!requireAuth()) return; setAddOpenKind(kind); }}>
              + Add {KIND_LABELS[kind].toLowerCase()}
            </button>
          </div>
        );
      })}

      {busy.kind === 'error' && (
        <div className="mvmt-toast" role="alert">
          {busy.message}
          <button type="button" className="mvmt-toast-dismiss" onClick={() => setBusy({ kind: 'idle' })}>Dismiss</button>
        </div>
      )}

      {signInOpen && (
        <SignInPanel
          onClose={() => setSignInOpen(false)}
          title="Sign in to edit"
          body={
            <>
              Pedagogical-arc connections are wiki-edit — any registered user can add, revise, reorder, or remove them.
              Sign in or create an account to make your change.
            </>
          }
        />
      )}
      {addOpenKind && (
        <PedagogicalAddModal
          pieceId={pieceId}
          kind={addOpenKind}
          pieceOptions={pieceOptions}
          excludeIds={Array.from(usedIds)}
          onCancel={() => setAddOpenKind(null)}
          onCreated={async () => { setAddOpenKind(null); await refetch(); }}
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------------

function pretty(msg: string, fallback: string): string {
  if (msg.includes('rate limit')) return 'Too many edits — wait a moment.';
  if (msg.includes('cannot connect a piece to itself')) return 'A piece cannot connect to itself.';
  return `${fallback}: ${msg}`;
}

interface Fields { relatedPieceId: string; note: string }

function PedagogicalEditForm({ initial, pieceOptions, excludeIds, busy, onCancel, onSave }: {
  initial: PedagogicalConnection;
  pieceOptions: PieceOption[];
  excludeIds: string[];
  busy: boolean;
  onCancel: () => void;
  onSave: (f: Fields) => void | Promise<void>;
}) {
  const [f, setF] = useState<Fields>({ relatedPieceId: initial.relatedPieceId, note: initial.note ?? '' });
  return (
    <div className="ed-editing">
      <PedagogicalFields fields={f} onChange={setF} pieceOptions={pieceOptions} excludeIds={excludeIds} />
      <div className="movement-edit-actions">
        <button type="button" className="movement-edit-button movement-edit-button-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="button" className="movement-edit-button movement-edit-button-primary" disabled={busy || !f.relatedPieceId} onClick={() => onSave(f)}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function PedagogicalAddModal({ pieceId, kind, pieceOptions, excludeIds, onCancel, onCreated }: {
  pieceId: string;
  kind: PedagogicalKind;
  pieceOptions: PieceOption[];
  excludeIds: string[];
  onCancel: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [f, setF] = useState<Fields>({ relatedPieceId: '', note: '' });
  const [state, setState] = useState<{ kind: 'idle' } | { kind: 'saving' } | { kind: 'error'; message: string }>({ kind: 'idle' });
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onCancel]);

  const save = useCallback(async () => {
    if (!f.relatedPieceId) { setState({ kind: 'error', message: 'Pick a piece first.' }); return; }
    setState({ kind: 'saving' });
    const { error } = await supabase.rpc('create_pedagogical_connection', {
      p_piece_id: pieceId,
      p_related_piece_id: f.relatedPieceId,
      p_kind: kind,
      p_note: f.note.trim() ? f.note.trim() : null,
    });
    if (error) {
      setState({ kind: 'error', message: pretty(error.message, 'Save failed') });
      return;
    }
    await onCreated();
  }, [f, pieceId, kind, onCreated]);

  return (
    <>
      <div className="movement-edit-backdrop" onClick={onCancel} aria-hidden="true" />
      <div ref={modalRef} className="movement-edit-modal" role="dialog" aria-modal="true" aria-labelledby="ped-add-title">
        <h2 id="ped-add-title" className="movement-edit-title">Add {KIND_LABELS[kind].toLowerCase()}</h2>
        <PedagogicalFields fields={f} onChange={setF} pieceOptions={pieceOptions} excludeIds={excludeIds} autoFocusFirst />
        {state.kind === 'error' && <div className="movement-edit-error" role="alert">{state.message}</div>}
        <div className="movement-edit-actions">
          <button type="button" className="movement-edit-button movement-edit-button-ghost" onClick={onCancel} disabled={state.kind === 'saving'}>Cancel</button>
          <button type="button" className="movement-edit-button movement-edit-button-primary" disabled={state.kind === 'saving' || !f.relatedPieceId} onClick={save}>
            {state.kind === 'saving' ? 'Saving…' : `Add ${KIND_LABELS[kind].toLowerCase()}`}
          </button>
        </div>
      </div>
    </>
  );
}

function PedagogicalFields({ fields, onChange, pieceOptions, excludeIds, autoFocusFirst }: {
  fields: Fields;
  onChange: (f: Fields) => void;
  pieceOptions: PieceOption[];
  excludeIds: string[];
  autoFocusFirst?: boolean;
}) {
  return (
    <>
      <label className="movement-edit-field">
        <span>Related piece</span>
        <PiecePicker
          options={pieceOptions}
          value={fields.relatedPieceId || null}
          onSelect={(id) => onChange({ ...fields, relatedPieceId: id ?? '' })}
          excludeIds={excludeIds}
          autoFocus={autoFocusFirst}
        />
      </label>
      <label className="movement-edit-field">
        <span>Note (optional)</span>
        <input
          type="text"
          value={fields.note}
          onChange={(e) => onChange({ ...fields, note: e.target.value })}
          maxLength={280}
          placeholder="One line on why these connect."
        />
      </label>
    </>
  );
}

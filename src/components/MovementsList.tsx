// Renders a piece's movements with wiki-edit affordances. Any authenticated
// user can edit name/tempo/key/meter in place (MovementEdit), reorder with
// ↑/↓, delete, or append a new movement at the end.
//
// Anon users see the same affordances. Clicking any of them opens a shared
// sign-in/register prompt instead of hiding the control (per user-memory
// "edit affordance at end of row, sign-in prompt for anon").
//
// State model: after any mutation we refetch the whole list so state stays
// consistent with DB ordering and version IDs. The wiki-edit pencil is the
// only affordance that updates optimistically (via MovementEdit's onUpdated
// callback) to keep the common single-field edit snappy.

import { useCallback, useEffect, useRef, useState } from 'react';
import MovementEdit from './MovementEdit';
import { CHANGELOG_REFRESH_EVENT } from './ChangeLog';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { useRequireAuth } from '../lib/useRequireAuth';
import { fetchMovementsForPiece, type Movement } from '../lib/movements';
import SignInPanel from './SignInPanel';
import StructuralLandmarks from './StructuralLandmarks';
import type { PublishedLandmark } from '../lib/landmarks';

export interface SeedMovement {
  name: string;
  key?: string;
  meter?: string;
}

interface Props {
  pieceId: string;
  initialMovements: Movement[];
  seedMovements: SeedMovement[];
  landmarksByMovement?: Record<string, PublishedLandmark[]>;
  // Awaiting-first-contribution mode: movement metadata stays editable
  // (unsigned reference per PRD §54), but the landmark-creation affordance
  // is suppressed so the awaiting-mode invite framing remains coherent —
  // landmarks are signed editorial per PRD §440 and should route through
  // the dedicated first-contribution CTA.
  awaitingMode?: boolean;
}

type Busy = { kind: 'idle' } | { kind: 'working'; movementId?: string } | { kind: 'error'; message: string };

export default function MovementsList({
  pieceId,
  initialMovements,
  seedMovements,
  landmarksByMovement = {},
  awaitingMode = false,
}: Props) {
  const { user } = useAuth();
  const {
    signInOpen,
    onClose: signInOnClose,
    onSignedIn: signInOnSignedIn,
    gate,
  } = useRequireAuth();
  const [movements, setMovements] = useState<Movement[]>(initialMovements);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState<Busy>({ kind: 'idle' });

  const broadcastChangelog = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent(CHANGELOG_REFRESH_EVENT, { detail: { pieceId } }),
    );
  }, [pieceId]);

  const refetch = useCallback(async () => {
    const next = await fetchMovementsForPiece(pieceId);
    setMovements(next);
    broadcastChangelog();
  }, [pieceId, broadcastChangelog]);

  const handleSwap = useCallback(
    (i: number, direction: 'up' | 'down') => {
      gate(() => void (async () => {
        const target = direction === 'up' ? i - 1 : i + 1;
        if (target < 0 || target >= movements.length) return;
        const a = movements[i];
        const b = movements[target];
        setBusy({ kind: 'working', movementId: a.id });
        const { error } = await supabase.rpc('swap_movement_ordinals', {
          p_movement_id_a: a.id,
          p_movement_id_b: b.id,
        });
        if (error) {
          const pretty = error.message.includes('rate limit')
            ? 'You’ve changed movements too often. Try again later.'
            : `Reorder failed: ${error.message}`;
          setBusy({ kind: 'error', message: pretty });
          return;
        }
        await refetch();
        setBusy({ kind: 'idle' });
      })());
    },
    [movements, refetch, gate],
  );

  const handleDelete = useCallback(
    (id: string) => {
      gate(() => void (async () => {
        setBusy({ kind: 'working', movementId: id });
        const { error } = await supabase.rpc('delete_movement', { p_movement_id: id });
        if (error) {
          const pretty = error.message.includes('rate limit')
            ? 'You’ve changed movements too often. Try again later.'
            : `Delete failed: ${error.message}`;
          setBusy({ kind: 'error', message: pretty });
          return;
        }
        setConfirmDeleteId(null);
        await refetch();
        setBusy({ kind: 'idle' });
      })());
    },
    [refetch, gate],
  );

  return (
    <>
      {movements.length > 0 ? (
        <div className="movements">
          {movements.map((m, i) => {
            const meta = [m.tempoIndication, m.keySignature, m.meter].filter(Boolean).join(' · ');
            const isFirst = i === 0;
            const isLast = i === movements.length - 1;
            const isConfirming = confirmDeleteId === m.id;
            const rowWorking = busy.kind === 'working' && busy.movementId === m.id;
            return (
              <div className="mvmt" key={m.id}>
                <div className="mvmt-head">
                  <h3>{m.name}</h3>
                  {meta && <span className="meta">{meta}</span>}

                  <div className="mvmt-controls" aria-label={`Controls for ${m.name}`}>
                    <button
                      type="button"
                      className="mvmt-ctrl"
                      aria-label={user ? `Move ${m.name} up` : `Sign in to move ${m.name}`}
                      disabled={isFirst || rowWorking}
                      onClick={() => handleSwap(i, 'up')}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="mvmt-ctrl"
                      aria-label={user ? `Move ${m.name} down` : `Sign in to move ${m.name}`}
                      disabled={isLast || rowWorking}
                      onClick={() => handleSwap(i, 'down')}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <MovementEdit
                      movement={m}
                      onUpdated={(next) => {
                        setMovements((prev) => prev.map((x) => (x.id === next.id ? next : x)));
                        broadcastChangelog();
                      }}
                    />
                    {isConfirming ? (
                      <span className="mvmt-confirm" role="alertdialog">
                        Delete?
                        <button
                          type="button"
                          className="mvmt-confirm-yes"
                          onClick={() => handleDelete(m.id)}
                          disabled={rowWorking}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          className="mvmt-confirm-no"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="mvmt-ctrl mvmt-ctrl-delete"
                        aria-label={user ? `Delete ${m.name}` : `Sign in to delete ${m.name}`}
                        onClick={() => gate(() => setConfirmDeleteId(m.id))}
                        disabled={rowWorking}
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <StructuralLandmarks
                  pieceId={pieceId}
                  movementId={m.id}
                  initialLandmarks={landmarksByMovement[m.id] ?? []}
                  awaitingMode={awaitingMode}
                />
              </div>
            );
          })}
        </div>
      ) : seedMovements.length > 0 ? (
        <div className="movements">
          {seedMovements.map((m, i) => {
            const meta = [m.key, m.meter].filter(Boolean).join(' · ');
            return (
              <div className="mvmt" key={`${m.name}-${i}`}>
                <div className="mvmt-head">
                  <h3>{m.name}</h3>
                  {meta && <span className="meta">{meta}</span>}
                </div>
                <p className="empty-state">Landmarks not yet curated for this movement.</p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="empty-state">Landmarks not yet curated.</p>
      )}

      <button
        type="button"
        className="mvmt-add"
        onClick={() => gate(() => setAddOpen(true))}
      >
        + Add movement
      </button>

      {busy.kind === 'error' && (
        <div className="mvmt-toast" role="alert">
          {busy.message}
          <button type="button" className="mvmt-toast-dismiss" onClick={() => setBusy({ kind: 'idle' })}>
            Dismiss
          </button>
        </div>
      )}

      {signInOpen && (
        <SignInPanel
          onClose={signInOnClose}
          onSignedIn={signInOnSignedIn}
          title="Sign in to edit"
          body={
            <>
              Movements are wiki-edit — any registered user can add, revise, reorder, or remove them.
              Sign in or create an account to make your change.
            </>
          }
        />
      )}

      {addOpen && (
        <AddMovementModal
          pieceId={pieceId}
          onCancel={() => setAddOpen(false)}
          onCreated={async () => {
            setAddOpen(false);
            await refetch();
          }}
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------------
// Add-movement modal — mirrors the MovementEdit form, calls create_movement.
// ----------------------------------------------------------------------------

function AddMovementModal({
  pieceId,
  onCancel,
  onCreated,
}: {
  pieceId: string;
  onCancel: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [fields, setFields] = useState({
    name: '',
    tempoIndication: '',
    keySignature: '',
    meter: '',
    editSummary: '',
  });
  const [state, setState] = useState<
    { kind: 'idle' } | { kind: 'saving' } | { kind: 'error'; message: string }
  >({ kind: 'idle' });
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => firstFieldRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const save = useCallback(async () => {
    const name = fields.name.trim();
    if (name.length < 1 || name.length > 200) {
      setState({ kind: 'error', message: 'Name must be 1–200 characters.' });
      return;
    }
    setState({ kind: 'saving' });
    const { error } = await supabase.rpc('create_movement', {
      p_piece_id: pieceId,
      p_name: name,
      p_tempo_indication: fields.tempoIndication.trim() || undefined,
      p_key_signature: fields.keySignature.trim() || undefined,
      p_meter: fields.meter.trim() || undefined,
      p_edit_summary: fields.editSummary.trim() || undefined,
    });
    if (error) {
      const pretty = error.message.includes('rate limit')
        ? 'You’ve changed movements too often. Try again later.'
        : error.message.includes('name must be')
          ? 'Name must be 1–200 characters.'
          : `Save failed: ${error.message}`;
      setState({ kind: 'error', message: pretty });
      return;
    }
    await onCreated();
  }, [fields, pieceId, onCreated]);

  return (
    <>
      <div className="movement-edit-backdrop" onClick={onCancel} aria-hidden="true" />
      <div
        ref={modalRef}
        className="movement-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="movement-add-title"
      >
        <h2 id="movement-add-title" className="movement-edit-title">
          Add movement
        </h2>

        <label className="movement-edit-field">
          <span>Name</span>
          <input
            ref={firstFieldRef}
            type="text"
            value={fields.name}
            onChange={(e) => setFields({ ...fields, name: e.target.value })}
            maxLength={200}
            placeholder="e.g. I. Prélude"
            required
          />
        </label>

        <div className="movement-edit-row">
          <label className="movement-edit-field">
            <span>Key signature</span>
            <input
              type="text"
              value={fields.keySignature}
              onChange={(e) => setFields({ ...fields, keySignature: e.target.value })}
              placeholder="e.g. G major"
            />
          </label>
          <label className="movement-edit-field">
            <span>Meter</span>
            <input
              type="text"
              value={fields.meter}
              onChange={(e) => setFields({ ...fields, meter: e.target.value })}
              placeholder="e.g. 4/4"
            />
          </label>
        </div>

        <label className="movement-edit-field">
          <span>Tempo indication</span>
          <input
            type="text"
            value={fields.tempoIndication}
            onChange={(e) => setFields({ ...fields, tempoIndication: e.target.value })}
            placeholder="e.g. Adagio sostenuto"
          />
        </label>

        <label className="movement-edit-field">
          <span>Edit summary (optional)</span>
          <input
            type="text"
            value={fields.editSummary}
            onChange={(e) => setFields({ ...fields, editSummary: e.target.value })}
            placeholder="Short note about what changed"
            maxLength={200}
          />
        </label>

        {state.kind === 'error' && (
          <div className="movement-edit-error" role="alert">
            {state.message}
          </div>
        )}

        <div className="movement-edit-actions">
          <button
            type="button"
            className="movement-edit-button movement-edit-button-ghost"
            onClick={onCancel}
            disabled={state.kind === 'saving'}
          >
            Cancel
          </button>
          <button
            type="button"
            className="movement-edit-button movement-edit-button-primary"
            onClick={save}
            disabled={state.kind === 'saving'}
          >
            {state.kind === 'saving' ? 'Saving…' : 'Add movement'}
          </button>
        </div>
      </div>
    </>
  );
}

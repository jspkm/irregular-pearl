// Wiki-edit surface for a single movement. Renders a pencil affordance that,
// on click, opens a modal with name + tempo + key + meter + ordinal +
// edit_summary fields. Save calls update_movement RPC; success closes the
// modal and calls onUpdated so the parent can refresh its view.
//
// Behavior (per plan §7.7):
//   - Modal-over-page, NOT inline reflow.
//   - Focus trapped: Tab cycles within modal, Esc closes + returns focus to
//     the pencil.
//   - Save-in-flight: Save button disabled + labeled "Saving…".
//   - Rate limit (10 edits/hour/user): caught by message pattern from the
//     RPC, surfaced as a toast-style inline error.
//   - Unauthenticated users never see the pencil.
//   - Pencil hover-revealed on desktop (pointer: fine), always 40% opacity
//     on mobile (pointer: coarse). Handled in CSS (piece-page.css).

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { useRequireAuth } from '../lib/useRequireAuth';
import type { Movement } from '../lib/movements';
import SignInPanel from './SignInPanel';

interface Props {
  movement: Movement;
  onUpdated?: (next: Movement) => void;
}

type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'error'; message: string };

export default function MovementEdit({ movement, onUpdated }: Props) {
  const { user } = useAuth();
  const {
    signInOpen: signInPrompt,
    onClose: signInPromptOnClose,
    onSignedIn: signInPromptOnSignedIn,
    gate,
  } = useRequireAuth();
  const [open, setOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'idle' });
  const [fields, setFields] = useState({
    name: movement.name,
    tempoIndication: movement.tempoIndication ?? '',
    keySignature: movement.keySignature ?? '',
    meter: movement.meter ?? '',
    ordinal: movement.ordinal,
    editSummary: '',
  });

  const pencilRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  // Reset form state when opening so subsequent edits start from the current
  // movement (in case another user updated it between modal opens).
  const openModal = useCallback(() => {
    gate(() => {
      setFields({
        name: movement.name,
        tempoIndication: movement.tempoIndication ?? '',
        keySignature: movement.keySignature ?? '',
        meter: movement.meter ?? '',
        ordinal: movement.ordinal,
        editSummary: '',
      });
      setSaveState({ kind: 'idle' });
      setOpen(true);
    });
  }, [movement, gate]);

  const closeModal = useCallback(() => {
    setOpen(false);
    // Return focus to the pencil that opened the modal.
    requestAnimationFrame(() => pencilRef.current?.focus());
  }, []);

  const closeSignInPrompt = useCallback(() => {
    signInPromptOnClose();
    requestAnimationFrame(() => pencilRef.current?.focus());
  }, [signInPromptOnClose]);

  // Focus trap + Esc handler while modal is open.
  useEffect(() => {
    if (!open) return;

    // Focus the first field on open.
    requestAnimationFrame(() => firstFieldRef.current?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        return;
      }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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
  }, [open, closeModal]);

  const save = useCallback(async () => {
    setSaveState({ kind: 'saving' });

    const name = fields.name.trim();
    if (name.length < 1 || name.length > 200) {
      setSaveState({ kind: 'error', message: 'Name must be 1–200 characters.' });
      return;
    }

    const { data: newVersionId, error } = await supabase.rpc('update_movement', {
      p_movement_id: movement.id,
      p_ordinal: fields.ordinal,
      p_name: name,
      p_tempo_indication: fields.tempoIndication.trim(),
      p_key_signature: fields.keySignature.trim(),
      p_meter: fields.meter.trim(),
      p_edit_summary: fields.editSummary.trim() || undefined,
    });

    if (error) {
      const msg = error.message || 'Failed to save.';
      const pretty = msg.includes('rate limit')
        ? 'You’ve edited this movement too often. Try again later.'
        : msg.includes('name must be')
          ? 'Name must be 1–200 characters.'
          : `Save failed: ${msg}`;
      setSaveState({ kind: 'error', message: pretty });
      return;
    }

    // Success. Emit the optimistic updated movement for the parent to pick up.
    onUpdated?.({
      ...movement,
      ordinal: fields.ordinal,
      name,
      tempoIndication: fields.tempoIndication.trim() || null,
      keySignature: fields.keySignature.trim() || null,
      meter: fields.meter.trim() || null,
      currentVersionId: (newVersionId as string | null) ?? movement.currentVersionId,
      updatedAt: new Date().toISOString(),
    });
    closeModal();
  }, [fields, movement, onUpdated, closeModal]);

  return (
    <>
      <button
        ref={pencilRef}
        type="button"
        className="movement-edit-pencil"
        aria-label={user ? `Edit movement: ${movement.name}` : `Sign in to edit movement: ${movement.name}`}
        onClick={openModal}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <>
          <div className="movement-edit-backdrop" onClick={closeModal} aria-hidden="true" />
          <div
            ref={modalRef}
            className="movement-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="movement-edit-title"
          >
            <h2 id="movement-edit-title" className="movement-edit-title">
              Edit movement
            </h2>

            <label className="movement-edit-field">
              <span>Name</span>
              <input
                ref={firstFieldRef}
                type="text"
                value={fields.name}
                onChange={(e) => setFields({ ...fields, name: e.target.value })}
                maxLength={200}
                required
              />
            </label>

            <div className="movement-edit-row">
              <label className="movement-edit-field">
                <span>Ordinal</span>
                <input
                  type="number"
                  min={1}
                  value={fields.ordinal}
                  onChange={(e) =>
                    setFields({ ...fields, ordinal: Math.max(1, Number(e.target.value) || 1) })
                  }
                />
              </label>
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

            {saveState.kind === 'error' && (
              <div className="movement-edit-error" role="alert">
                {saveState.message}
              </div>
            )}

            <div className="movement-edit-actions">
              <button
                type="button"
                className="movement-edit-button movement-edit-button-ghost"
                onClick={closeModal}
                disabled={saveState.kind === 'saving'}
              >
                Cancel
              </button>
              <button
                type="button"
                className="movement-edit-button movement-edit-button-primary"
                onClick={save}
                disabled={saveState.kind === 'saving'}
              >
                {saveState.kind === 'saving' ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </>
      )}

      {signInPrompt && (
        <SignInPanel
          onClose={closeSignInPrompt}
          onSignedIn={signInPromptOnSignedIn}
          title="Sign in to edit"
          body={
            <>
              Movements are wiki-edit — any registered user can revise the name, tempo, key, or meter.
              Sign in or create an account to make your edit.
            </>
          }
        />
      )}
    </>
  );
}

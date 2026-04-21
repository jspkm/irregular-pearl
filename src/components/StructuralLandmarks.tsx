// Per-movement landmark surface: renders the published landmarks under a
// movement header, plus an always-visible "Add landmark" entry that drops
// into an inline form calling publish_contributor_landmark. Anon users see
// the entry and get a sign-in prompt on click.
//
// Card layout: one-line header (measure range · italic label · owner
// edit/delete + VoteThumbs · flags right-aligned), then description,
// signed practice-note blocks (2px purple left border), then the
// contributor byline at the bottom.
//
// Write flow: any authenticated user can publish a landmark; the RPC
// publishes immediately (contributor === authenticated user). Owners see
// inline edit + delete affordances calling publish_contributor_landmark_edit
// and remove_landmark.

import { useCallback, useEffect, useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import type { PublishedLandmark, LandmarkFlag } from '../lib/landmarks';
import { getPublishedLandmarksForPiece } from '../lib/landmarks';
import VoteThumbs from './VoteThumbs';
import OwnerEditDelete from './OwnerEditDelete';
import SignInPanel from './SignInPanel';

interface Props {
  pieceId: string;
  movementId: string;
  initialLandmarks: PublishedLandmark[];
}

const FLAG_TYPES: { value: string; label: string }[] = [
  { value: 'stamina', label: 'stamina' },
  { value: 'bow_control', label: 'bow control' },
  { value: 'stretch', label: 'stretch' },
  { value: 'voicing', label: 'voicing' },
  { value: 'double_stops', label: 'double stops' },
  { value: 'sustained_bowing', label: 'sustained bowing' },
  { value: 'articulation', label: 'articulation' },
  { value: 'rhythmic_lift', label: 'rhythmic lift' },
  { value: 'intonation', label: 'intonation' },
  { value: 'ensemble_coordination', label: 'ensemble coordination' },
];

const FLAG_LABELS = Object.fromEntries(FLAG_TYPES.map((f) => [f.value, f.label]));

const SEVERITIES: { value: 'informational' | 'notable' | 'significant'; label: string }[] = [
  { value: 'informational', label: 'Informational' },
  { value: 'notable', label: 'Notable' },
  { value: 'significant', label: 'Significant' },
];

function formatMeasureRange(start: number, end: number | null): string {
  if (end === null || end === start) return `m. ${start}`;
  return `mm. ${start}–${end}`;
}

function FlagPill({ flag }: { flag: LandmarkFlag }) {
  const label = FLAG_LABELS[flag.type] ?? flag.type.replace(/_/g, ' ');
  const instruments = flag.instrument_specificity ?? [];
  const suffix =
    instruments.length === 0
      ? ''
      : instruments.length <= 2
        ? ` (${instruments.join(', ')})`
        : ` (${instruments.slice(0, 2).join(', ')}, +${instruments.length - 2})`;
  return (
    <span className={`flag-pill flag-pill-${flag.severity}`}>
      {flag.severity === 'significant' && <span className="flag-pill-dot" aria-hidden="true">●</span>}
      {flag.severity === 'notable' && <span className="flag-pill-dot" aria-hidden="true">○</span>}
      <span className="flag-pill-label">
        {label}
        {suffix}
      </span>
    </span>
  );
}

type EditMode = null | { action: 'edit'; landmarkId: string };

export default function StructuralLandmarks({ pieceId, movementId, initialLandmarks }: Props) {
  const [landmarks, setLandmarks] = useState<PublishedLandmark[]>(initialLandmarks);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<EditMode>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);

  useEffect(() => {
    if (!hasSupabase) { setAuthed(false); setViewerId(null); return; }
    void supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setViewerId(uid);
      setAuthed(Boolean(uid));
    });
  }, []);

  const refetch = useCallback(async () => {
    const all = await getPublishedLandmarksForPiece(pieceId);
    setLandmarks(all.filter((l) => l.movementId === movementId));
  }, [pieceId, movementId]);

  const onAddClick = () => {
    if (authed === false) { setSignInOpen(true); return; }
    setFormOpen(true);
  };

  async function handleRemove(landmarkId: string) {
    setBusy(true); setError(null);
    const { error: err } = await supabase.rpc('remove_landmark', { p_landmark_id: landmarkId });
    setBusy(false);
    if (err) { setError(err.message); return; }
    await refetch();
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('notifications:changed'));
  }

  return (
    <>
      {error && (
        <div className="landmark-form-error" role="alert">{error}</div>
      )}

      {landmarks.length > 0 && (
        <div className="landmark-list">
          {landmarks.map((l) => {
            const isOwner = viewerId !== null && viewerId === l.contributor.id;
            const isEditing = mode?.action === 'edit' && mode.landmarkId === l.landmarkId;

            if (isEditing) {
              return (
                <LandmarkForm
                  key={l.landmarkId}
                  pieceId={pieceId}
                  movementId={movementId}
                  mode={{ kind: 'edit', landmark: l }}
                  onCancel={() => { setMode(null); setError(null); }}
                  onPublished={async () => { setMode(null); await refetch(); }}
                />
              );
            }

            return (
              <article className="landmark-card" key={l.landmarkId} id={`landmark-${l.landmarkId}`}>
                <header className="landmark-header">
                  <span className="landmark-measure">{formatMeasureRange(l.measureStart, l.measureEnd)}</span>
                  <h4 className="landmark-label">{l.label}</h4>
                  <span className="landmark-header-actions">
                    {isOwner && (
                      <OwnerEditDelete
                        itemLabel="landmark"
                        onEdit={() => { setMode({ action: 'edit', landmarkId: l.landmarkId }); setError(null); }}
                        onDelete={() => handleRemove(l.landmarkId)}
                        busy={busy}
                      />
                    )}
                    <VoteThumbs subjectTable="landmarks" subjectId={l.landmarkId} />
                  </span>
                  {l.flags.length > 0 && (
                    <span className="landmark-header-flags" aria-label="Practice flags">
                      {l.flags.map((f, i) => (
                        <FlagPill key={`${f.type}-${f.severity}-${i}`} flag={f} />
                      ))}
                    </span>
                  )}
                </header>

                {l.description && <p className="landmark-description">{l.description}</p>}

                {l.practiceNotes.length > 0 && (
                  <div className="landmark-practice-notes">
                    {l.practiceNotes.map((pn, i) => (
                      <blockquote className="landmark-practice-note" key={i}>
                        {pn.body.split(/\n\s*\n/).map((para, j) => (
                          <p key={j}>{para}</p>
                        ))}
                      </blockquote>
                    ))}
                  </div>
                )}

                <div className="landmark-by">
                  <span className="landmark-by-name">{l.contributor.displayName}</span>
                  {l.contributor.bioShort && (
                    <>
                      <span className="landmark-by-dash" aria-hidden="true">—</span>
                      <span className="landmark-by-bio">{l.contributor.bioShort}</span>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {formOpen ? (
        <LandmarkForm
          pieceId={pieceId}
          movementId={movementId}
          mode={{ kind: 'create' }}
          onCancel={() => setFormOpen(false)}
          onPublished={async () => { setFormOpen(false); await refetch(); }}
        />
      ) : (
        mode === null && (
          <button type="button" className="landmark-add" onClick={onAddClick}>
            Add landmark at this passage &rarr;
          </button>
        )
      )}

      {signInOpen && (
        <SignInPanel
          onClose={() => setSignInOpen(false)}
          title="Sign in to add"
          body={<>Landmarks are signed — any registered user can add one. Sign in or create an account to post yours.</>}
        />
      )}
    </>
  );
}

interface FormProps {
  pieceId: string;
  movementId: string;
  mode: { kind: 'create' } | { kind: 'edit'; landmark: PublishedLandmark };
  onCancel: () => void;
  onPublished: () => void | Promise<void>;
}

type FlagDraft = { type: string; severity: 'informational' | 'notable' | 'significant' };

function LandmarkForm({ pieceId, movementId, mode, onCancel, onPublished }: FormProps) {
  const editing = mode.kind === 'edit' ? mode.landmark : null;
  const [measureStart, setMeasureStart] = useState(editing ? String(editing.measureStart) : '');
  const [measureEnd, setMeasureEnd] = useState(editing?.measureEnd != null ? String(editing.measureEnd) : '');
  const [label, setLabel] = useState(editing?.label ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [flags, setFlags] = useState<FlagDraft[]>(
    editing?.flags.map((f) => ({
      type: f.type,
      severity: (f.severity as FlagDraft['severity']) || 'informational',
    })) ?? [],
  );
  const [practiceNotes, setPracticeNotes] = useState<string[]>(
    editing?.practiceNotes.map((pn) => pn.body) ?? [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    !busy &&
    label.trim().length > 0 &&
    Number.parseInt(measureStart, 10) >= 1 &&
    flags.every((f) => f.type.length > 0);

  async function submit() {
    const mStart = Number.parseInt(measureStart, 10);
    if (!Number.isFinite(mStart) || mStart < 1) { setError('Measure start must be at least 1.'); return; }
    const mEnd = measureEnd.trim() === '' ? null : Number.parseInt(measureEnd, 10);
    if (mEnd !== null && (!Number.isFinite(mEnd) || mEnd < mStart)) {
      setError('Measure end must be ≥ measure start.');
      return;
    }
    if (label.trim().length === 0) { setError('Label required.'); return; }

    const cleanedPNs = practiceNotes.map((b) => b.trim()).filter((b) => b.length > 0).map((body) => ({ body }));

    setBusy(true); setError(null);
    const { error: err } = editing
      ? await supabase.rpc('publish_contributor_landmark_edit', {
          p_landmark_id: editing.landmarkId,
          p_measure_start: mStart,
          p_measure_end: mEnd,
          p_label: label.trim(),
          p_description: description.trim() === '' ? null : description,
          p_flags: flags,
          p_practice_notes: cleanedPNs,
        })
      : await supabase.rpc('publish_contributor_landmark', {
          p_piece_id: pieceId,
          p_movement_id: movementId,
          p_measure_start: mStart,
          p_measure_end: mEnd,
          p_label: label.trim(),
          p_description: description.trim() === '' ? null : description,
          p_flags: flags,
          p_practice_notes: cleanedPNs,
        });
    setBusy(false);
    if (err) { setError(err.message); return; }
    await onPublished();
  }

  return (
    <div className="landmark-form" role="group" aria-label={editing ? 'Edit landmark' : 'Add landmark'}>
      {error && <div className="landmark-form-error" role="alert">{error}</div>}

      <div className="landmark-form-row">
        <label className="landmark-form-field">
          <span>Measure start</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={measureStart}
            onChange={(e) => setMeasureStart(e.target.value)}
            placeholder="e.g. 1"
          />
        </label>
        <label className="landmark-form-field">
          <span>Measure end <em>(optional)</em></span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={measureEnd}
            onChange={(e) => setMeasureEnd(e.target.value)}
            placeholder="e.g. 8"
          />
        </label>
      </div>

      <label className="landmark-form-field">
        <span>Label</span>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={60}
          placeholder="e.g. Opening sweep"
        />
      </label>

      <label className="landmark-form-field">
        <span>Description <em>(optional)</em></span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={4000}
          placeholder="One line of editorial framing."
        />
      </label>

      <fieldset className="landmark-form-fieldset">
        <legend>Flags</legend>
        {flags.map((f, i) => (
          <div className="landmark-form-flag-row" key={i}>
            <select
              value={f.type}
              onChange={(e) => setFlags((prev) => prev.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}
            >
              <option value="">Choose a flag…</option>
              {FLAG_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select
              value={f.severity}
              onChange={(e) =>
                setFlags((prev) =>
                  prev.map((x, j) => (j === i ? { ...x, severity: e.target.value as FlagDraft['severity'] } : x)),
                )
              }
            >
              {SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button
              type="button"
              className="landmark-form-inline-remove"
              aria-label="Remove flag"
              onClick={() => setFlags((prev) => prev.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="landmark-form-inline-add"
          onClick={() => setFlags((prev) => [...prev, { type: '', severity: 'informational' }])}
        >
          + Add flag
        </button>
      </fieldset>

      <fieldset className="landmark-form-fieldset">
        <legend>Practice notes</legend>
        {practiceNotes.map((body, i) => (
          <div className="landmark-form-pn-row" key={i}>
            <textarea
              value={body}
              onChange={(e) => setPracticeNotes((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
              rows={3}
              maxLength={4000}
              placeholder="What do you tell yourself when you practice this passage?"
            />
            <button
              type="button"
              className="landmark-form-inline-remove"
              aria-label="Remove practice note"
              onClick={() => setPracticeNotes((prev) => prev.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="landmark-form-inline-add"
          onClick={() => setPracticeNotes((prev) => [...prev, ''])}
        >
          + Add practice note
        </button>
      </fieldset>

      <div className="landmark-form-actions">
        <button
          type="button"
          className="landmark-form-submit"
          onClick={submit}
          disabled={!canSubmit}
        >
          {busy ? (editing ? 'Saving…' : 'Publishing…') : (editing ? 'Save' : 'Publish')}
        </button>
        <button
          type="button"
          className="landmark-form-cancel"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

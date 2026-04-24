// User-contributed four-axis difficulty ratings. Mirrors
// SignedPieceDescription — the seed axes defined in
// src/data/difficulty-axes.ts anchor the bottom of the stack, and user
// ratings sort ahead of it by vote_tallies.net_score DESC (applied
// server-side via fetch_ordered_subjects). Chevrons rotate through; seed
// and user cards both carry thumbs.

import { useEffect, useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import type { PublishedPieceDifficulty } from '../lib/pieceDifficulty';
import type { PieceDifficultyAxes, DifficultyAxis } from '../data/difficulty-axes';
import VoteThumbs from './VoteThumbs';
import OwnerEditDelete from './OwnerEditDelete';
import SignInPanel from './SignInPanel';
import { useRequireAuth } from '../lib/useRequireAuth';

type AxisKey = 'technical' | 'stamina' | 'interpretive' | 'ensemble';

const AXIS_ORDER: Array<{ key: AxisKey; label: string }> = [
  { key: 'technical', label: 'Technical' },
  { key: 'stamina', label: 'Stamina' },
  { key: 'interpretive', label: 'Interpretive' },
  { key: 'ensemble', label: 'Ensemble' },
];

// Derived editorial label — matches the tier convention in difficulty-axes.ts.
function levelLabel(level: number): string {
  switch (level) {
    case 0:
      return 'n/a';
    case 1:
      return 'Light';
    case 2:
      return 'Intermediate';
    case 3:
      return 'Moderate';
    case 4:
      return 'Advanced';
    case 5:
      return 'Professional';
    default:
      return '—';
  }
}

interface Props {
  pieceId: string;
  initialRatings: PublishedPieceDifficulty[];
  seedAxes: PieceDifficultyAxes | null;
  seedDifficultyVoteId: string | null;
}

type StackItem =
  | { kind: 'user'; rating: PublishedPieceDifficulty }
  | { kind: 'seed'; axes: PieceDifficultyAxes };

interface ViewerProfile {
  displayName: string | null;
  bioShort: string | null;
}

type Mode = null | 'write' | { action: 'edit'; ratingId: string };

interface AxisDraft {
  level: number;
  note: string;
}

type Draft = Record<AxisKey, AxisDraft>;

function emptyDraft(): Draft {
  return {
    technical: { level: 0, note: '' },
    stamina: { level: 0, note: '' },
    interpretive: { level: 0, note: '' },
    ensemble: { level: 0, note: '' },
  };
}

function draftFromRating(r: PublishedPieceDifficulty): Draft {
  return {
    technical: { level: r.technical.level, note: r.technical.note ?? '' },
    stamina: { level: r.stamina.level, note: r.stamina.note ?? '' },
    interpretive: { level: r.interpretive.level, note: r.interpretive.note ?? '' },
    ensemble: { level: r.ensemble.level, note: r.ensemble.note ?? '' },
  };
}

export default function SignedPieceDifficulty({
  pieceId,
  initialRatings,
  seedAxes,
  seedDifficultyVoteId,
}: Props) {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<PublishedPieceDifficulty[]>(initialRatings);
  const [profile, setProfile] = useState<ViewerProfile>({ displayName: null, bioShort: null });
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stackIdx, setStackIdx] = useState(0);
  const {
    signInOpen,
    onClose: signInOnClose,
    onSignedIn: signInOnSignedIn,
    gate,
  } = useRequireAuth();

  const stackItems: StackItem[] = [
    ...ratings.map((rating) => ({ kind: 'user' as const, rating })),
    ...(seedAxes ? [{ kind: 'seed' as const, axes: seedAxes }] : []),
  ];
  const safeIdx = stackItems.length === 0 ? 0 : Math.min(stackIdx, stackItems.length - 1);
  const active = stackItems[safeIdx];
  const prev = () =>
    setStackIdx((i) => (stackItems.length === 0 ? 0 : (i - 1 + stackItems.length) % stackItems.length));
  const next = () =>
    setStackIdx((i) => (stackItems.length === 0 ? 0 : (i + 1) % stackItems.length));

  useEffect(() => {
    let cancelled = false;
    if (!hasSupabase || !user) {
      setProfile({ displayName: null, bioShort: null });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('users')
        .select('display_name, contributor_bio_short')
        .eq('id', user.id)
        .single();
      if (cancelled) return;
      setProfile({
        displayName: data?.display_name ?? null,
        bioShort: data?.contributor_bio_short ?? null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function refetch() {
    const { data } = await supabase
      .from('piece_difficulty_ratings')
      .select(
        'id, contributor_id, technical_level, technical_note, stamina_level, stamina_note, interpretive_level, interpretive_note, ensemble_level, ensemble_note',
      )
      .eq('piece_id', pieceId)
      .eq('status', 'published')
      .order('created_at', { ascending: true });
    if (!data || data.length === 0) {
      setRatings([]);
      return;
    }
    const contribIds = [...new Set(data.map((r) => r.contributor_id))];
    const { data: contribs } = await supabase
      .from('users')
      .select('id, display_name, contributor_bio_short')
      .in('id', contribIds);
    const cById = new Map((contribs ?? []).map((c) => [c.id, c]));

    const rows: PublishedPieceDifficulty[] = [];
    for (const r of data) {
      const c = cById.get(r.contributor_id);
      if (!c) continue;
      rows.push({
        ratingId: r.id,
        technical: { level: r.technical_level, note: r.technical_note ?? null },
        stamina: { level: r.stamina_level, note: r.stamina_note ?? null },
        interpretive: { level: r.interpretive_level, note: r.interpretive_note ?? null },
        ensemble: { level: r.ensemble_level, note: r.ensemble_note ?? null },
        contributor: {
          id: c.id,
          displayName: c.display_name,
          bioShort: c.contributor_bio_short ?? null,
        },
      });
    }
    setRatings(rows);
  }

  async function handleWrite(draft: Draft) {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.rpc('publish_contributor_piece_difficulty', {
      p_piece_id: pieceId,
      p_technical_level: draft.technical.level,
      p_technical_note: draft.technical.note.trim(),
      p_stamina_level: draft.stamina.level,
      p_stamina_note: draft.stamina.note.trim(),
      p_interpretive_level: draft.interpretive.level,
      p_interpretive_note: draft.interpretive.note.trim(),
      p_ensemble_level: draft.ensemble.level,
      p_ensemble_note: draft.ensemble.note.trim(),
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMode(null);
    await refetch();
  }

  async function handleEdit(ratingId: string, draft: Draft) {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.rpc('publish_contributor_piece_difficulty_edit', {
      p_rating_id: ratingId,
      p_technical_level: draft.technical.level,
      p_technical_note: draft.technical.note.trim(),
      p_stamina_level: draft.stamina.level,
      p_stamina_note: draft.stamina.note.trim(),
      p_interpretive_level: draft.interpretive.level,
      p_interpretive_note: draft.interpretive.note.trim(),
      p_ensemble_level: draft.ensemble.level,
      p_ensemble_note: draft.ensemble.note.trim(),
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMode(null);
    await refetch();
  }

  async function handleRemove(ratingId: string) {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.rpc('remove_piece_difficulty', { p_rating_id: ratingId });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    await refetch();
  }

  const isEditing = mode !== null && typeof mode === 'object' && mode.action === 'edit';
  const editingRatingId = isEditing ? (mode as { ratingId: string }).ratingId : null;
  const writeLabel = ratings.length === 0 ? 'Add your own difficulty rating' : 'Add another rating';

  if (!active && mode !== 'write') {
    // No seed and no user ratings — still surface the write affordance so the
    // section is actionable.
    return (
      <div className="diff-stack">
        {renderError(error)}
        {renderWriteEntry()}
        {signInOpen && (
          <SignInPanel
            onClose={signInOnClose}
            onSignedIn={signInOnSignedIn}
            title="Sign in to rate"
            body={<>Signed ratings are authored — any registered user can publish their own four-axis difficulty. Sign in or create an account to post yours.</>}
          />
        )}
      </div>
    );
  }

  return (
    <div className="diff-stack">
      {renderError(error)}

      {mode === 'write' && user ? (
        <DifficultyEditForm
          initial={emptyDraft()}
          contributor={{ name: profile.displayName ?? 'You', bio: profile.bioShort }}
          submitting={busy}
          onCancel={() => {
            setMode(null);
            setError(null);
          }}
          onSubmit={handleWrite}
          submitLabel="Publish"
          submittingLabel="Publishing…"
        />
      ) : (
        <div className={`desc-stack${stackItems.length > 1 ? ' has-more' : ''}`}>
          {stackItems.length > 2 && <div className="desc-stack-behind depth-2" aria-hidden="true" />}
          {stackItems.length > 1 && <div className="desc-stack-behind depth-1" aria-hidden="true" />}

          {active?.kind === 'user' ? (
            (() => {
              const r = active.rating;
              const isOwner = user?.id === r.contributor.id;
              const editingThis = editingRatingId === r.ratingId;
              if (editingThis && user) {
                return (
                  <article className="diff-card desc-stack-top">
                    <DifficultyEditForm
                      initial={draftFromRating(r)}
                      contributor={{ name: profile.displayName ?? r.contributor.displayName, bio: profile.bioShort }}
                      submitting={busy}
                      onCancel={() => {
                        setMode(null);
                        setError(null);
                      }}
                      onSubmit={(draft) => handleEdit(r.ratingId, draft)}
                    />
                  </article>
                );
              }
              return (
                <article className="diff-card desc-stack-top">
                  <AxesGrid
                    axes={{
                      technical: { level: r.technical.level, label: levelLabel(r.technical.level), note: r.technical.note ?? '' },
                      stamina: { level: r.stamina.level, label: levelLabel(r.stamina.level), note: r.stamina.note ?? '' },
                      interpretive: { level: r.interpretive.level, label: levelLabel(r.interpretive.level), note: r.interpretive.note ?? '' },
                      ensemble: { level: r.ensemble.level, label: levelLabel(r.ensemble.level), note: r.ensemble.note ?? '' },
                    }}
                  />
                  <div className="diff-card-by">
                    <div className="diff-card-by-left">
                      <span className="name">{r.contributor.displayName}</span>
                      {r.contributor.bioShort && (
                        <>
                          <span className="dot" aria-hidden="true"></span>
                          <span>{r.contributor.bioShort}</span>
                        </>
                      )}
                    </div>
                    <div className="diff-card-by-right">
                      {isOwner && (
                        <OwnerEditDelete
                          itemLabel="difficulty rating"
                          onEdit={() => {
                            setMode({ action: 'edit', ratingId: r.ratingId });
                            setError(null);
                          }}
                          onDelete={() => handleRemove(r.ratingId)}
                          busy={busy}
                        />
                      )}
                      <VoteThumbs subjectTable="piece_difficulty_ratings" subjectId={r.ratingId} />
                    </div>
                  </div>
                </article>
              );
            })()
          ) : (
            active && (
              <article className="diff-card desc-stack-top diff-card-seed">
                <AxesGrid axes={active.axes} />
                {seedDifficultyVoteId && (
                  <div className="diff-card-by diff-card-by-seed">
                    <VoteThumbs subjectTable="pieces_seed_difficulty" subjectId={seedDifficultyVoteId} />
                  </div>
                )}
              </article>
            )
          )}

          {stackItems.length > 1 && (
            <div className="desc-stack-controls">
              <button type="button" className="desc-stack-chev" aria-label="Previous rating" onClick={prev}>
                ←
              </button>
              <span className="desc-stack-indicator" aria-live="polite">
                {safeIdx + 1} <span className="desc-stack-sep">of</span> {stackItems.length}
              </span>
              <button type="button" className="desc-stack-chev" aria-label="Next rating" onClick={next}>
                →
              </button>
            </div>
          )}
        </div>
      )}

      {mode !== 'write' && !isEditing && renderWriteEntry()}

      {signInOpen && (
        <SignInPanel
          onClose={() => setSignInOpen(false)}
          title="Sign in to rate"
          body={<>Signed ratings are authored — any registered user can publish their own four-axis difficulty. Sign in or create an account to post yours.</>}
        />
      )}

      <style>{`
        .diff-stack { margin-bottom: 48px; }
        .diff-card { padding: 20px 24px; }
        .diff-card-by {
          margin-top: 18px;
          font-family: var(--font-sans);
          font-size: 13px;
          color: var(--ink);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .diff-card-by-left {
          display: flex;
          align-items: center;
          gap: 0;
          flex: 1 1 auto;
          min-width: 0;
        }
        .diff-card-by-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 0 0 auto;
        }
        .diff-card-by .name { font-weight: 500; }
        .diff-card-by .dot {
          display: inline-block;
          width: 3px; height: 3px;
          border-radius: 50%;
          background: var(--muted);
          margin: 0 8px;
          vertical-align: middle;
        }
        .diff-card-by span:not(.name):not(.dot) { color: var(--muted); }
        .diff-card-by-seed { justify-content: flex-end; }
        .write-entry-diff {
          margin-top: 24px;
          background: transparent;
          border: 0;
          color: var(--accent);
          font-family: var(--font-sans);
          font-size: 13px;
          padding: 0;
          cursor: pointer;
        }
        .write-entry-diff:hover { color: var(--ink); }
      `}</style>
    </div>
  );

  function renderError(err: string | null) {
    if (!err) return null;
    return (
      <div
        role="alert"
        className="mb-4 rounded-lg border-[0.5px] px-3 py-2 text-sm"
        style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
      >
        {err}
      </div>
    );
  }

  function renderWriteEntry() {
    return (
      <button
        type="button"
        onClick={() => {
          setError(null);
          gate(() => setMode('write'));
        }}
        className="write-entry-diff"
      >
        {writeLabel} &rarr;
      </button>
    );
  }
}

function AxesGrid({ axes }: { axes: PieceDifficultyAxes }) {
  return (
    <div className="diff-panel" style={{ border: 0, padding: 0, margin: 0, background: 'transparent' }}>
      {AXIS_ORDER.map(({ key, label }) => {
        const a: DifficultyAxis = axes[key];
        return (
          <div className="diff-axis" key={key}>
            <div className="lab">{label}</div>
            <div className="bars">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={n <= a.level ? 'on' : ''}></span>
              ))}
            </div>
            <div className="val">{a.label}</div>
            {a.note && <div className="note">{a.note}</div>}
          </div>
        );
      })}
    </div>
  );
}

function DifficultyEditForm(props: {
  initial: Draft;
  contributor: { name: string; bio: string | null };
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (draft: Draft) => void;
  submitLabel?: string;
  submittingLabel?: string;
}) {
  const [draft, setDraft] = useState<Draft>(props.initial);
  const submitLabel = props.submitLabel ?? 'Save';
  const submittingLabel = props.submittingLabel ?? 'Saving…';

  const setAxis = (key: AxisKey, patch: Partial<AxisDraft>) =>
    setDraft((d) => ({ ...d, [key]: { ...d[key], ...patch } }));

  return (
    <div>
      <div className="diff-edit-grid">
        {AXIS_ORDER.map(({ key, label }) => {
          const a = draft[key];
          return (
            <div className="diff-edit-axis" key={key}>
              <div className="lab">{label}</div>
              <div className="level-picker" role="radiogroup" aria-label={`${label} level`}>
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    role="radio"
                    aria-checked={a.level === n}
                    className={`level-btn${a.level === n ? ' is-active' : ''}`}
                    onClick={() => setAxis(key, { level: n })}
                  >
                    {n === 0 ? 'n/a' : n}
                  </button>
                ))}
              </div>
              <div className="level-label">{levelLabel(a.level)}</div>
              <textarea
                className="axis-note"
                value={a.note}
                onChange={(e) => setAxis(key, { note: e.target.value })}
                rows={2}
                placeholder="Optional — what makes this axis score what it scores?"
                maxLength={500}
              />
            </div>
          );
        })}
      </div>

      <div className="diff-edit-by">
        <span style={{ fontWeight: 500 }}>{props.contributor.name}</span>
        {props.contributor.bio && (
          <>
            <span style={{ margin: '0 8px', color: 'var(--muted)' }}>·</span>
            <span style={{ color: 'var(--muted)' }}>{props.contributor.bio}</span>
          </>
        )}
      </div>

      <div className="diff-edit-actions">
        <button
          type="button"
          onClick={() => props.onSubmit(draft)}
          disabled={props.submitting}
          className="diff-edit-primary"
        >
          {props.submitting ? submittingLabel : submitLabel}
        </button>
        <button
          type="button"
          onClick={props.onCancel}
          disabled={props.submitting}
          className="diff-edit-secondary"
        >
          Cancel
        </button>
      </div>

      <style>{`
        .diff-edit-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .diff-edit-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .diff-edit-grid { grid-template-columns: 1fr; }
        }
        .diff-edit-axis .lab {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted);
          font-weight: 500;
          margin-bottom: 10px;
        }
        .level-picker {
          display: flex;
          gap: 4px;
          margin-bottom: 8px;
        }
        .level-btn {
          appearance: none;
          background: transparent;
          border: 0.5px solid var(--border-strong);
          border-radius: 6px;
          padding: 4px 0;
          flex: 1;
          font-family: var(--font-sans);
          font-size: 12px;
          color: var(--muted);
          cursor: pointer;
          transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease;
        }
        .level-btn:hover { color: var(--ink); border-color: var(--ink); }
        .level-btn.is-active {
          background: var(--accent);
          color: var(--bg);
          border-color: var(--accent);
        }
        .level-label {
          font-size: 13px;
          color: var(--ink);
          font-weight: 500;
          margin-bottom: 8px;
        }
        .axis-note {
          width: 100%;
          font-family: var(--font-sans);
          font-size: 12px;
          color: var(--ink);
          background: transparent;
          border: 0.5px solid var(--border-strong);
          border-radius: 6px;
          padding: 6px 8px;
          resize: vertical;
          line-height: 1.4;
        }
        .diff-edit-by {
          margin-top: 18px;
          font-family: var(--font-sans);
          font-size: 13px;
          text-align: right;
        }
        .diff-edit-actions {
          margin-top: 12px;
          display: flex;
          gap: 8px;
        }
        .diff-edit-primary {
          background: var(--ink);
          color: var(--bg);
          border: 0;
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
        }
        .diff-edit-primary[disabled] { opacity: 0.5; cursor: not-allowed; }
        .diff-edit-secondary {
          background: transparent;
          color: var(--ink);
          border: 0.5px solid var(--border-strong);
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
        }
        .diff-edit-secondary[disabled] { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

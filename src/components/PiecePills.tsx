// Pills row under the piece byline — the contributor surface for piece
// metadata (instrument, era, form, duration, difficulty). Anyone signed
// in can add a pill where a slot is open; anyone can delete a user-source
// pill; mods/admins can also delete seed/mod pills and see a subtle dot
// cue on un-deletable pills so they know which is which.
//
// Display order is fixed: instrument(s) → era → form → duration → difficulty.
// Within instrument the order is alphabetical (sorted client-side).
//
// Single-value categories (era, form, duration, difficulty) accept at most
// one pill per piece. The `+` button hides when every single-value category
// is filled AND every controlled instrument is already on the piece.

import { useEffect, useMemo, useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import {
  PILL_CATEGORIES,
  SINGLE_VALUE_CATEGORIES,
  ERAS,
  FORMS,
  DIFFICULTIES,
  isValidPillValue,
  type PillCategory,
} from '../data/pill-vocabulary';
import { INSTRUMENTS } from '../data/instruments';
import type { Pill } from '../lib/piecePills';

interface Props {
  pieceId: string;
  initialPills: Pill[];
}

const CATEGORY_LABEL: Record<PillCategory, string> = {
  instrument: 'instrument',
  era: 'era',
  form: 'form',
  duration: 'duration',
  difficulty: 'difficulty',
};

export default function PiecePills({ pieceId, initialPills }: Props) {
  const { user } = useAuth();
  const [pills, setPills] = useState<Pill[]>(initialPills);
  const [role, setRole] = useState<'user' | 'moderator' | 'admin' | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCategory, setPickerCategory] = useState<PillCategory | null>(null);
  const [durationDraft, setDurationDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Look up role for staff cue + delete gating. Anonymous = null.
  useEffect(() => {
    if (!user || !hasSupabase) {
      setRole(null);
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
        const r = (data as any)?.role;
        setRole(r === 'admin' || r === 'moderator' ? r : 'user');
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isStaff = role === 'admin' || role === 'moderator';
  const isAuthed = !!user;

  // Group pills by category in display order. Within instrument, sort A-Z.
  const grouped = useMemo(() => {
    const out: Record<PillCategory, Pill[]> = {
      instrument: [],
      era: [],
      form: [],
      duration: [],
      difficulty: [],
    };
    for (const p of pills) out[p.category].push(p);
    out.instrument.sort((a, b) => a.value.localeCompare(b.value));
    return out;
  }, [pills]);

  // Build the set of categories the current user can still add to.
  const addableCategories = useMemo<PillCategory[]>(() => {
    const result: PillCategory[] = [];
    for (const cat of PILL_CATEGORIES) {
      if (SINGLE_VALUE_CATEGORIES.has(cat)) {
        if (grouped[cat].length === 0) result.push(cat);
      } else {
        // instrument: addable if any controlled value isn't already a pill
        const used = new Set(grouped.instrument.map((p) => p.value));
        const remaining = INSTRUMENTS.some((v) => !used.has(v));
        if (remaining) result.push(cat);
      }
    }
    return result;
  }, [grouped]);

  const showAddButton = isAuthed && addableCategories.length > 0;

  const availableValuesFor = (cat: PillCategory): string[] => {
    if (cat === 'duration') return [];
    if (cat === 'instrument') {
      const used = new Set(grouped.instrument.map((p) => p.value));
      return INSTRUMENTS.filter((v) => !used.has(v));
    }
    if (cat === 'era') return [...ERAS];
    if (cat === 'form') return [...FORMS];
    if (cat === 'difficulty') return [...DIFFICULTIES];
    return [];
  };

  const closePicker = () => {
    setPickerOpen(false);
    setPickerCategory(null);
    setDurationDraft('');
    setError(null);
  };

  const addPill = async (category: PillCategory, value: string) => {
    if (!hasSupabase) return;
    setBusy(true);
    setError(null);
    try {
      if (!isValidPillValue(category, value)) {
        setError(category === 'duration' ? 'duration must look like "~18 min"' : 'value not in the controlled list');
        setBusy(false);
        return;
      }
      const { data, error: rpcErr } = await supabase.rpc('add_piece_pill', {
        p_piece_id: pieceId,
        p_category: category,
        p_value: value,
      });
      if (rpcErr) throw rpcErr;
      // Optimistic insert with returned id.
      setPills((prev) => [
        ...prev,
        {
          id: data as string,
          pieceId,
          category,
          value: category === 'duration' ? value.trim() : value.trim().toLowerCase(),
          source: isStaff ? 'mod' : 'user',
          addedBy: user?.id ?? null,
          createdAt: new Date().toISOString(),
        },
      ]);
      closePicker();
    } catch (e: any) {
      setError(e?.message ?? 'failed to add pill');
    } finally {
      setBusy(false);
    }
  };

  const removePill = async (pill: Pill) => {
    if (!hasSupabase) return;
    setBusy(true);
    setError(null);
    try {
      const { error: rpcErr } = await supabase.rpc('remove_piece_pill', { p_pill_id: pill.id });
      if (rpcErr) throw rpcErr;
      setPills((prev) => prev.filter((p) => p.id !== pill.id));
    } catch (e: any) {
      setError(e?.message ?? 'failed to delete pill');
    } finally {
      setBusy(false);
    }
  };

  const canDelete = (pill: Pill): boolean => {
    if (!isAuthed) return false;
    if (pill.source === 'user') return true;
    return isStaff;
  };

  // Display in the fixed pill order: instruments (sorted), era, form, duration, difficulty
  const displayOrder: Pill[] = [
    ...grouped.instrument,
    ...grouped.era,
    ...grouped.form,
    ...grouped.duration,
    ...grouped.difficulty,
  ];

  return (
    <div className="pills" role="list" aria-label="Piece metadata">
      {displayOrder.map((pill) => (
        <PillChip
          key={pill.id}
          pill={pill}
          deletable={canDelete(pill)}
          // Staff get a subtle dot cue on pills they cannot remove via the
          // user-source rule (i.e. seed and mod), so they know which were
          // staff-curated vs. drive-by user adds.
          showStaffCue={isStaff && pill.source !== 'user'}
          busy={busy}
          onDelete={() => removePill(pill)}
        />
      ))}

      {showAddButton && !pickerOpen && (
        <button
          type="button"
          className="pill pill-add"
          onClick={() => setPickerOpen(true)}
          aria-label="Add pill"
        >
          +
        </button>
      )}

      {pickerOpen && (
        <span className="pill-picker" role="group" aria-label="Add pill">
          {pickerCategory == null ? (
            <>
              <span className="pill-picker-label">add</span>
              {addableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className="pill pill-picker-cat"
                  onClick={() => setPickerCategory(cat)}
                  disabled={busy}
                >
                  {CATEGORY_LABEL[cat]}
                </button>
              ))}
              <button type="button" className="pill-picker-cancel" onClick={closePicker} disabled={busy} aria-label="Cancel">
                ×
              </button>
            </>
          ) : pickerCategory === 'duration' ? (
            <>
              <span className="pill-picker-label">{CATEGORY_LABEL[pickerCategory]}</span>
              <input
                type="text"
                className="pill-picker-input"
                placeholder="~18 min"
                value={durationDraft}
                onChange={(e) => setDurationDraft(e.target.value)}
                disabled={busy}
                autoFocus
              />
              <button
                type="button"
                className="pill pill-picker-go"
                onClick={() => addPill('duration', durationDraft)}
                disabled={busy || durationDraft.trim() === ''}
              >
                add
              </button>
              <button type="button" className="pill-picker-cancel" onClick={closePicker} disabled={busy} aria-label="Cancel">
                ×
              </button>
            </>
          ) : (
            <>
              <span className="pill-picker-label">{CATEGORY_LABEL[pickerCategory]}</span>
              <select
                className="pill-picker-select"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) addPill(pickerCategory!, v);
                }}
                disabled={busy}
                defaultValue=""
                autoFocus
              >
                <option value="" disabled>
                  choose…
                </option>
                {availableValuesFor(pickerCategory).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <button type="button" className="pill-picker-cancel" onClick={closePicker} disabled={busy} aria-label="Cancel">
                ×
              </button>
            </>
          )}
        </span>
      )}

      {error && <span className="pill-error" role="alert">{error}</span>}
    </div>
  );
}

interface ChipProps {
  pill: Pill;
  deletable: boolean;
  showStaffCue: boolean;
  busy: boolean;
  onDelete: () => void;
}

function PillChip({ pill, deletable, showStaffCue, busy, onDelete }: ChipProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="pill pill-confirming" role="alertdialog">
        delete {pill.value}?
        <button type="button" className="pill-confirm-yes" onClick={onDelete} disabled={busy}>
          yes
        </button>
        <button type="button" className="pill-confirm-no" onClick={() => setConfirming(false)} disabled={busy}>
          no
        </button>
      </span>
    );
  }

  return (
    <span
      className={`pill ${pill.source === 'user' ? 'pill-user' : ''} ${pill.source === 'mod' ? 'pill-mod' : ''}`}
      role="listitem"
      data-source={pill.source}
    >
      {pill.value}
      {showStaffCue && <span className="pill-staff-cue" aria-hidden="true" />}
      {deletable && (
        <button
          type="button"
          className="pill-delete"
          onClick={() => setConfirming(true)}
          disabled={busy}
          aria-label={`Delete ${pill.value}`}
        >
          ×
        </button>
      )}
    </span>
  );
}

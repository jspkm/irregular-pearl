// Shared constants + helpers for the four contribution-draft kinds.
// One source of truth for kind-labels, articles, and tempo-cues serialisation.
// Anything that maps a DraftKind to human copy or reshapes payload.tempo_cues
// goes here so the sender-side, recipient-side, and admin-side surfaces
// never drift.

import type { DraftKind } from './contributionDrafts';

export const KIND_LABEL: Record<DraftKind, string> = {
  performers_note: "performer's note",
  interpretive_school: 'interpretive school',
  piece_description: 'piece description',
  landmark: 'landmark',
};

export const KIND_LABEL_TITLE: Record<DraftKind, string> = {
  performers_note: "Performer's note",
  interpretive_school: 'Interpretive school',
  piece_description: 'Piece description',
  landmark: 'Landmark',
};

export const KIND_ARTICLE: Record<DraftKind, string> = {
  performers_note: 'a',
  interpretive_school: 'an',
  piece_description: 'a',
  landmark: 'a',
};

export interface TempoRow {
  section: string;
  value: string;
}

/** Normalize jsonb tempo_cues into a flat list of section -> value rows. */
export function tempoCuesToRows(raw: unknown): TempoRow[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  const out: TempoRow[] = [];
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    out.push({ section: k, value: typeof v === 'string' ? v : String(v ?? '') });
  }
  return out;
}

/** Collapse rows back into the jsonb record. Null if all rows are empty. */
export function rowsToTempoCues(rows: TempoRow[]): Record<string, string> | null {
  const obj: Record<string, string> = {};
  let any = false;
  for (const r of rows) {
    const s = r.section.trim();
    const v = r.value.trim();
    if (!s || !v) continue;
    obj[s] = v;
    any = true;
  }
  return any ? obj : null;
}

/** Pull non-empty [section, value] entries for display. */
export function tempoCueEntries(raw: unknown): Array<[string, string]> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  return Object.entries(raw as Record<string, unknown>).filter(
    (e): e is [string, string] => typeof e[1] === 'string' && e[1].trim().length > 0,
  );
}

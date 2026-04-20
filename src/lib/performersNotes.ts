// Helpers for fetching published performer's notes on a piece.
// Thin wrapper over supabase-js; see the Slice A RPC migration for the
// security-definer functions that handle mutations.

import { supabase, hasSupabase } from './supabase';

export interface PublishedPerformersNote {
  noteId: string;
  versionId: string;
  body: string;
  versionNumber: number;
  approvedAt: string | null;
  contributor: {
    id: string;
    displayName: string;
    bioShort: string | null;
  };
}

/**
 * Fetch all published performer's notes for a piece, joined to the current
 * version body + the bylined contributor's profile. RLS scopes this to
 * status='published' for anonymous callers, so it's safe to call from SSR.
 *
 * Three round-trips (notes, versions, contributors) instead of a nested
 * select — PostgREST can't disambiguate the two FKs between notes and
 * versions (note_id and the composite current-version FK), and separate
 * `in(...)` queries keep the plan readable.
 */
export async function getPublishedPerformersNotes(pieceId: string): Promise<PublishedPerformersNote[]> {
  if (!hasSupabase) return [];

  const notesRes = await supabase
    .from('performers_notes')
    .select('id, contributor_id, current_version_id, approved_by_contributor_at')
    .eq('piece_id', pieceId)
    .eq('status', 'published')
    .order('approved_by_contributor_at', { ascending: true });
  if (notesRes.error || !notesRes.data || notesRes.data.length === 0) return [];

  const versionIds = notesRes.data.map((n) => n.current_version_id).filter((x): x is string => Boolean(x));
  const contributorIds = [...new Set(notesRes.data.map((n) => n.contributor_id))];

  // Use the `v_performers_note_versions_published` view: RLS on the base
  // version table deliberately blocks anon reads, and the view is granted
  // to anon + authenticated.
  const [versionsRes, contribsRes] = await Promise.all([
    supabase
      .from('v_performers_note_versions_published')
      .select('id, body, version_number, approved_at')
      .in('id', versionIds),
    supabase
      .from('users')
      .select('id, display_name, contributor_bio_short')
      .in('id', contributorIds),
  ]);
  if (versionsRes.error || !versionsRes.data) return [];
  if (contribsRes.error || !contribsRes.data) return [];

  const versionById = new Map(versionsRes.data.map((v) => [v.id, v]));
  const contribById = new Map(contribsRes.data.map((c) => [c.id, c]));

  const rows: PublishedPerformersNote[] = [];
  for (const n of notesRes.data) {
    if (!n.current_version_id) continue;
    const version = versionById.get(n.current_version_id);
    const contributor = contribById.get(n.contributor_id);
    if (!version || !contributor) continue;
    rows.push({
      noteId: n.id,
      versionId: version.id,
      body: version.body,
      versionNumber: version.version_number,
      approvedAt: version.approved_at,
      contributor: {
        id: contributor.id,
        displayName: contributor.display_name,
        bioShort: contributor.contributor_bio_short ?? null,
      },
    });
  }
  return rows;
}

// External-link CRUD helpers. Shared by the Recordings surface and the
// External references surface — the UI splits rows by type.

import { supabase, hasSupabase } from './supabase';

export const REFERENCE_TYPES = ['imslp', 'wikipedia'] as const;
export const RECORDING_TYPES = [
  'youtube', 'vimeo', 'spotify', 'internet_archive', 'soundcloud', 'bandcamp',
] as const;
export type ExternalLinkType = typeof REFERENCE_TYPES[number] | typeof RECORDING_TYPES[number];

export interface ExternalLink {
  id: string;
  pieceId: string;
  type: string;
  url: string;
  label: string;
  source: string;
  ordinal: number;
}

// Translate a recording's source URL into an embeddable iframe URL. Returns
// null for types we cannot embed (caller falls back to "Open on source").
// Lifted from PiecePageLayout.astro so the client-side RecordingsList can
// recompute embeds after a wiki edit without a server round-trip.
export function recordingEmbedUrl(type: string, rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (type === 'youtube') {
      const v = url.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}?autoplay=1`;
      if (url.hostname === 'youtu.be') return `https://www.youtube.com/embed${url.pathname}?autoplay=1`;
      return null;
    }
    if (type === 'vimeo') {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      if (/^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}?autoplay=1`;
      return null;
    }
    if (type === 'internet_archive') {
      const m = url.pathname.match(/^\/details\/([^/?#]+)/);
      if (m) return `https://archive.org/embed/${m[1]}`;
      return null;
    }
    if (type === 'spotify') {
      const m = url.pathname.match(/^\/(track|album|playlist|episode)\/([^/?#]+)/);
      if (m) return `https://open.spotify.com/embed/${m[1]}/${m[2]}`;
      return null;
    }
  } catch {
    // fall through
  }
  return null;
}

export async function fetchExternalLinksForPiece(pieceId: string): Promise<ExternalLink[]> {
  if (!hasSupabase) return [];
  const { data, error } = await supabase
    .from('external_links')
    .select('id, piece_id, type, url, label, source, ordinal')
    .eq('piece_id', pieceId)
    .is('deleted_at', null)
    .order('ordinal', { ascending: true });
  if (error) {
    console.error('fetchExternalLinksForPiece', error);
    return [];
  }
  return (data ?? []).map((r: any) => ({
    id: r.id,
    pieceId: r.piece_id,
    type: r.type,
    url: r.url,
    label: r.label,
    source: r.source,
    ordinal: r.ordinal,
  }));
}

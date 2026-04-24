/**
 * Unified data access layer for pieces.
 * Normalizes data from seed files and Supabase into the same shape.
 */
import { seedPieces, type SeedPiece } from '../data/seed';
import { supabase, hasSupabase } from './supabase';
import type { Difficulty, LinkType } from './database.types';

// ---------- shared shapes ----------

export interface PieceBasic {
  id: string;
  title: string;
  composer_name: string;
  catalog_number: string | null;
  instruments: string[];
  era: string | null;
  form: string | null;
  difficulty: Difficulty | null;
  duration_minutes: number | null;
  description: string;
  source: string;
}

export interface Edition {
  id: string;
  publisher: string;
  editor: string;
  year: number | null;
  description: string;
  type?: 'urtext' | 'scholarly' | 'performer' | 'facsimile' | 'critical' | 'practical';
  url?: string;
}

export interface ExternalLink {
  type: LinkType;
  url: string;
  label: string;
  source?: string;
}

export interface Movement {
  name: string;
  pieceId?: string;
  key?: string;
  meter?: string;
}

export interface PieceFull extends PieceBasic {
  editions: Edition[];
  external_links: ExternalLink[];
  movements: Movement[];
  /**
   * True when at least one published signed contribution exists on the piece
   * (performer's note, interpretive school, landmark, or piece description).
   * Derived from `v_pieces_with_content_state` for Supabase-backed pieces.
   * Always false for seed-only pieces that haven't been materialized.
   */
  has_signed_content: boolean;
}

// ---------- seed helpers ----------

const seedMap = new Map<string, SeedPiece>(seedPieces.map((p) => [p.id, p]));

function seedToBasic(s: SeedPiece): PieceBasic {
  return {
    id: s.id,
    title: s.title,
    composer_name: s.composer_name,
    catalog_number: s.catalog_number,
    instruments: s.instruments,
    era: s.era,
    form: s.form,
    difficulty: s.difficulty,
    duration_minutes: s.duration_minutes,
    description: s.description,
    source: 'seed',
  };
}

function seedToFull(s: SeedPiece): PieceFull {
  return {
    ...seedToBasic(s),
    editions: s.editions.map((e) => ({
      id: e.id,
      publisher: e.publisher,
      editor: e.editor,
      year: e.year,
      description: e.description,
      type: e.type,
      url: e.url,
    })),
    external_links: s.external_links.map((l) => ({
      type: l.type,
      url: l.url,
      label: l.label,
      source: 'seed',
    })),
    movements: (s.movements ?? []).map((m) => ({
      name: m.name,
      pieceId: m.pieceId,
      key: m.key,
      meter: m.meter,
    })),
    // Seed pieces never carry signed content directly; if they're also
    // materialized in Supabase, getPieceFull overrides this via the DB path.
    has_signed_content: false,
  };
}

// ---------- public API ----------

/**
 * Get basic piece info (no JOINs). Checks seed data first, then Supabase.
 */
export async function getPieceBasic(id: string): Promise<PieceBasic | null> {
  const seed = seedMap.get(id);
  if (seed) return seedToBasic(seed);

  if (!hasSupabase) return null;

  try {
    const { data, error } = await supabase
      .from('pieces')
      .select('id, title, composer_name, catalog_number, instruments, era, form, difficulty, duration_minutes, description, source')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      title: data.title,
      composer_name: data.composer_name,
      catalog_number: data.catalog_number,
      instruments: data.instruments,
      era: data.era,
      form: data.form,
      difficulty: data.difficulty,
      duration_minutes: data.duration_minutes,
      description: data.description,
      source: (data as any).source ?? 'unknown',
    };
  } catch {
    return null;
  }
}

/**
 * Get full piece info with editions, external_links, and movements.
 * Checks seed data first, then Supabase with JOINs.
 */
export async function getPieceFull(id: string): Promise<PieceFull | null> {
  const seed = seedMap.get(id);

  // Seed short-circuit: pieces authored in src/data/seed.ts have richer
  // shape (movements, curated editions/links) than the raw Supabase row.
  // For those, we still want to know has_signed_content — look it up as a
  // lightweight side query without disturbing the richer seed data.
  if (seed) {
    const base = seedToFull(seed);
    if (hasSupabase) {
      const { data: state } = await supabase
        .from('v_pieces_with_content_state')
        .select('has_signed_content')
        .eq('id', id)
        .maybeSingle();
      return { ...base, has_signed_content: state?.has_signed_content ?? false };
    }
    return base;
  }

  if (!hasSupabase) return null;

  try {
    // Non-seed piece: source of truth is Supabase. Fetch piece + child tables
    // in parallel with the signed-content state view.
    const [pieceResult, stateResult] = await Promise.all([
      supabase
        .from('pieces')
        .select(
          `
        id, title, composer_name, catalog_number, instruments, era, form,
        difficulty, duration_minutes, description, source,
        editions ( id, publisher, editor, year, description ),
        external_links ( id, type, url, label, source )
      `,
        )
        .eq('id', id)
        .single(),
      supabase
        .from('v_pieces_with_content_state')
        .select('has_signed_content')
        .eq('id', id)
        .maybeSingle(),
    ]);

    if (pieceResult.error || !pieceResult.data) return null;

    const data = pieceResult.data;
    const has_signed_content = stateResult.data?.has_signed_content ?? false;

    return {
      id: data.id,
      title: data.title,
      composer_name: data.composer_name,
      catalog_number: data.catalog_number,
      instruments: data.instruments,
      era: data.era,
      form: data.form,
      difficulty: data.difficulty,
      duration_minutes: data.duration_minutes,
      description: data.description,
      source: (data as any).source ?? 'unknown',
      editions: ((data as any).editions ?? []).map((e: any) => ({
        id: e.id,
        publisher: e.publisher,
        editor: e.editor,
        year: e.year,
        description: e.description,
      })),
      external_links: ((data as any).external_links ?? []).map((l: any) => ({
        type: l.type,
        url: l.url,
        label: l.label,
        source: l.source,
      })),
      movements: [], // materialize-only pieces don't carry movements yet
      has_signed_content,
    };
  } catch {
    return null;
  }
}

/**
 * Returns true when the piece is in its "pre-piece" state — no published
 * signed content (performer's note, interpretive school, landmark, piece
 * description). The URL exists but the page is a deliberate blank slot,
 * inviting the first contributor.
 *
 * Design doc: the pre-piece page is visibly different from an active piece
 * page. This predicate drives that branch.
 */
export function isStub(piece: PieceFull): boolean {
  return !piece.has_signed_content;
}

/**
 * Get all pieces for a given composer. Merges seed + Supabase (case-insensitive).
 * Returns basic piece shape, no JOINs.
 */
export async function getComposerPieces(composerName: string): Promise<PieceBasic[]> {
  const lowerName = composerName.toLowerCase();

  // Seed pieces for this composer
  const fromSeed = seedPieces
    .filter((p) => p.composer_name.toLowerCase() === lowerName)
    .map(seedToBasic);

  if (!hasSupabase) return fromSeed;

  try {
    const { data, error } = await supabase
      .from('pieces')
      .select('id, title, composer_name, catalog_number, instruments, era, form, difficulty, duration_minutes, description, source')
      .ilike('composer_name', composerName);

    if (error || !data) return fromSeed;

    const seedIds = new Set(fromSeed.map((p) => p.id));
    const fromDb: PieceBasic[] = data
      .filter((row) => !seedIds.has(row.id))
      .map((row) => ({
        id: row.id,
        title: row.title,
        composer_name: row.composer_name,
        catalog_number: row.catalog_number,
        instruments: row.instruments,
        era: row.era,
        form: row.form,
        difficulty: row.difficulty,
        duration_minutes: row.duration_minutes,
        description: row.description,
        source: (row as any).source ?? 'unknown',
      }));

    return [...fromSeed, ...fromDb];
  } catch {
    return fromSeed;
  }
}

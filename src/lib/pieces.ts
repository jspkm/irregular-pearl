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
  era: string;
  form: string;
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
  if (seed) return seedToFull(seed);

  if (!hasSupabase) return null;

  try {
    const { data, error } = await supabase
      .from('pieces')
      .select(`
        id, title, composer_name, catalog_number, instruments, era, form,
        difficulty, duration_minutes, description, source,
        editions ( id, publisher, editor, year, description ),
        external_links ( id, type, url, label, source )
      `)
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
      movements: [], // Supabase pieces don't have movements yet
    };
  } catch {
    return null;
  }
}

/**
 * Returns true if the piece is a "stub" — has 0 editions AND 0 user-sourced external_links.
 * Used to decide whether to show stub page UI or full page.
 */
export function isStub(piece: PieceFull): boolean {
  const userLinks = piece.external_links.filter((l) => l.source === 'user');
  return piece.editions.length === 0 && userLinks.length === 0;
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

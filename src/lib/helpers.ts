// Pure helper functions extracted for testability

import type { ActivityType } from './database.types';

// ── Activity types (single source of truth) ──

export const ACTIVITIES: { type: ActivityType; emoji: string; label: string }[] = [
  { type: 'working_on', emoji: '✊', label: 'Working on this' },
  { type: 'listened', emoji: '👂', label: 'Listened / studied' },
  { type: 'practiced', emoji: '🎵', label: 'Practiced' },
  { type: 'sight_read', emoji: '🏁', label: 'Sight-read' },
  { type: 'took_lesson', emoji: '📖', label: 'Took a lesson' },
  { type: 'performed', emoji: '🎤', label: 'Performed' },
];

export const ACTIVITY_STAT_LABELS: Record<string, string> = {
  practiced: 'practice', took_lesson: 'lessons', performed: 'performances',
  listened: 'listens', sight_read: 'sight-reads', working_on: 'working',
};

// ── Grouping utility ──

export function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

export function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ── Performance note starters ──

export const NOTE_STARTERS = [
  'The acoustics were incredible because...',
  'I wasn\'t expecting the encore to be...',
  'The highlight was the second movement when...',
  'What surprised me most was...',
  'I\'ll never forget the moment when...',
  'The conductor\'s interpretation of the adagio...',
  'My hands were shaking before the cadenza but...',
  'The audience reaction after the final chord...',
  'I finally understood why this piece matters when...',
  'Three words: standing ovation because...',
  'The soloist did something unexpected in the...',
  'Best sight-reading experience of my life because...',
  'I almost didn\'t go, but I\'m glad I did because...',
  'The venue made the pianissimo sections feel like...',
  'After years of practicing this piece, performing it felt...',
];

export function randomNoteStarter(): string {
  return NOTE_STARTERS[Math.floor(Math.random() * NOTE_STARTERS.length)];
}

// ── Social URL normalization ──

const SOCIAL_BASES: Record<string, string> = {
  'Instagram': 'https://instagram.com/',
  'YouTube': 'https://youtube.com/@',
  'X / Twitter': 'https://x.com/',
  'Facebook': 'https://facebook.com/',
};

const SOCIAL_ICONS: Record<string, string> = {
  'Instagram': '<path d="M7.8 2h8.4C19 2 22 5 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C5 22 2 19 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>',
  'YouTube': '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43zM9.75 15.02V8.48l5.75 3.27-5.75 3.27z"/>',
  'X / Twitter': '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>',
  'Facebook': '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
};

export function normalizeSocialUrl(platform: string, value: string): string {
  if (!value) return '';
  const v = value.trim();
  // Already a full URL
  if (v.startsWith('http://') || v.startsWith('https://')) return v;
  // Strip leading @
  const username = v.startsWith('@') ? v.slice(1) : v;
  const base = SOCIAL_BASES[platform];
  return base ? `${base}${username}` : `https://${v}`;
}

export function getSocialIcon(platform: string): string {
  return SOCIAL_ICONS[platform] || '';
}

export function normalizeWebsiteUrl(url: string): string {
  if (!url) return '';
  const v = url.trim();
  if (v.startsWith('http://') || v.startsWith('https://')) return v;
  return `https://${v}`;
}

// ── Fuzzy search result mapping ──

export interface FuzzyRow {
  match_type: string;
  match_id: string;
  match_title: string;
  match_subtitle: string;
  similarity: number;
}

export interface FuzzyResults {
  pieceIds: string[];
  artists: { id: string; display_name: string; instrument: string | null; username: null }[];
  events: { id: string; title: string; venue: string | null; city: null; event_date: string; event_type: string }[];
}

export function mapFuzzyResults(rows: FuzzyRow[]): FuzzyResults {
  return {
    pieceIds: rows.filter(r => r.match_type === 'piece').map(r => r.match_id),
    artists: rows.filter(r => r.match_type === 'artist').map(r => ({
      id: r.match_id,
      display_name: r.match_title,
      instrument: r.match_subtitle || null,
      username: null,
    })),
    events: rows.filter(r => r.match_type === 'event').map(r => ({
      id: r.match_id,
      title: r.match_title,
      venue: r.match_subtitle || null,
      city: null,
      event_date: '',
      event_type: '',
    })),
  };
}

// ── Slug validation ──

const RESERVED_SLUGS = [
  'about', 'terms', 'privacy', 'piece', 'composer', 'instrument',
  'instruments', 'events', 'admin', 'api', 'auth', 'login', 'signup',
  'settings', 'search', 'sitemap', 'llms', 'openapi', 'profile',
  'help', 'support', 'contact', 'blog', 'news', 'feed', 'explore',
];

export function validateSlug(slug: string): { valid: boolean; error?: string } {
  // Must be lowercase
  if (slug !== slug.toLowerCase())
    return { valid: false, error: 'Must be lowercase' };

  const s = slug;

  if (s.length < 3 || s.length > 30)
    return { valid: false, error: 'Must be 3-30 characters' };

  if (!/^[a-z0-9-]+$/.test(s))
    return { valid: false, error: 'Only lowercase letters, numbers, and hyphens allowed' };

  if (/--/.test(s))
    return { valid: false, error: 'Cannot contain consecutive hyphens' };

  if (!/^[a-z0-9]/.test(s) || !/[a-z0-9]$/.test(s))
    return { valid: false, error: 'Must start and end with a letter or number' };

  if (RESERVED_SLUGS.includes(s))
    return { valid: false, error: 'This username is reserved' };

  // Profanity check (basic inline list, avoids ESM/CJS issues with leo-profanity)
  const PROFANITY = ['fuck', 'shit', 'ass', 'dick', 'cunt', 'nigger', 'faggot', 'retard', 'whore', 'slut', 'bitch'];
  if (PROFANITY.some(w => s.includes(w)))
    return { valid: false, error: 'This username is not allowed' };

  return { valid: true };
}

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

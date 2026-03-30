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

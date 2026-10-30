export interface PiecePerformance {
  id: string;
  user_id: string | null;
  event_name: string;
  venue: string | null;
  date: string;
  piece_id: string;
  concert_url: string | null;
}

export function normalizeConcertUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

export function formatPerformanceDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return {
    month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date),
    day: new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date),
    full: new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }).format(date),
  };
}

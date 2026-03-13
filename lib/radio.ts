import type { Track } from "./types";

export interface RadioPosition {
  trackIndex: number;
  position: number;
}

/**
 * Given a radio state's startedAtMillis and trackIndex, compute the current
 * track and position within that track. Walks forward through the playlist
 * if enough time has elapsed for one or more tracks to have finished.
 * Wraps around via modulo for infinite looping.
 */
export function computeCurrentRadioPosition(
  tracks: Track[],
  startedAtMillis: number,
  startedTrackIndex: number
): RadioPosition {
  if (tracks.length === 0) return { trackIndex: 0, position: 0 };

  let elapsed = (Date.now() - startedAtMillis) / 1000;
  if (elapsed < 0) elapsed = 0;

  let idx = startedTrackIndex % tracks.length;

  // Walk forward through tracks if elapsed exceeds current track's duration
  while (elapsed >= tracks[idx].durationSeconds && tracks.length > 0) {
    elapsed -= tracks[idx].durationSeconds;
    idx = (idx + 1) % tracks.length;
  }

  return { trackIndex: idx, position: elapsed };
}

/**
 * Check if the insight cache entry is still fresh (< 24 hours old).
 */
export function isInsightFresh(generatedAtMillis: number): boolean {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  return Date.now() - generatedAtMillis < TWENTY_FOUR_HOURS;
}

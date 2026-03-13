import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { computeCurrentRadioPosition } from "../radio";
import type { Track } from "../types";

function makeTrack(id: string, durationSeconds: number): Track {
  return {
    id,
    title: id,
    composer: "Test",
    performers: [],
    durationSeconds,
    epoch: "",
    source: "",
    audioUrl: "",
    license: "",
  };
}

describe("computeCurrentRadioPosition", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns index 0, position 0 for empty tracks", () => {
    const result = computeCurrentRadioPosition([], Date.now(), 0);
    expect(result).toEqual({ trackIndex: 0, position: 0 });
  });

  it("returns correct position within the first track", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const tracks = [makeTrack("a", 300), makeTrack("b", 200)];
    // Started 100 seconds ago
    const result = computeCurrentRadioPosition(tracks, now - 100_000, 0);
    expect(result.trackIndex).toBe(0);
    expect(result.position).toBeCloseTo(100, 0);
  });

  it("advances to the next track when elapsed exceeds first track duration", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const tracks = [makeTrack("a", 300), makeTrack("b", 200)];
    // Started 350 seconds ago — should be 50s into track b
    const result = computeCurrentRadioPosition(tracks, now - 350_000, 0);
    expect(result.trackIndex).toBe(1);
    expect(result.position).toBeCloseTo(50, 0);
  });

  it("wraps around to the first track (forever loop)", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const tracks = [makeTrack("a", 100), makeTrack("b", 100)];
    // Started 250 seconds ago — total playlist is 200s, so 250-200=50s into track a again
    const result = computeCurrentRadioPosition(tracks, now - 250_000, 0);
    expect(result.trackIndex).toBe(0);
    expect(result.position).toBeCloseTo(50, 0);
  });

  it("handles single-track playlist", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const tracks = [makeTrack("a", 100)];
    // Started 150 seconds ago — wraps back to same track at 50s
    const result = computeCurrentRadioPosition(tracks, now - 150_000, 0);
    expect(result.trackIndex).toBe(0);
    expect(result.position).toBeCloseTo(50, 0);
  });

  it("starts from the correct track index", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const tracks = [makeTrack("a", 100), makeTrack("b", 200), makeTrack("c", 150)];
    // Started at track index 1, 50 seconds ago — should be 50s into track b
    const result = computeCurrentRadioPosition(tracks, now - 50_000, 1);
    expect(result.trackIndex).toBe(1);
    expect(result.position).toBeCloseTo(50, 0);
  });

  it("catches up across multiple tracks from a starting index", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const tracks = [makeTrack("a", 100), makeTrack("b", 100), makeTrack("c", 100)];
    // Started at track 0, 250 seconds ago — past a(100) + b(100) + c(50) = into track c at 50s
    const result = computeCurrentRadioPosition(tracks, now - 250_000, 0);
    expect(result.trackIndex).toBe(2);
    expect(result.position).toBeCloseTo(50, 0);
  });

  it("handles future startedAtMillis gracefully (clamps to 0)", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const tracks = [makeTrack("a", 100)];
    // Started 10 seconds in the future
    const result = computeCurrentRadioPosition(tracks, now + 10_000, 0);
    expect(result.trackIndex).toBe(0);
    expect(result.position).toBe(0);
  });
});

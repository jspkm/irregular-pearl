import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isInsightFresh } from "../radio";

describe("isInsightFresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true for insight generated just now", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    expect(isInsightFresh(now)).toBe(true);
  });

  it("returns true for insight generated 23 hours ago", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const twentyThreeHoursAgo = now - 23 * 60 * 60 * 1000;
    expect(isInsightFresh(twentyThreeHoursAgo)).toBe(true);
  });

  it("returns false for insight generated 25 hours ago", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000;
    expect(isInsightFresh(twentyFiveHoursAgo)).toBe(false);
  });

  it("returns false for insight generated exactly 24 hours ago", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const exactly24h = now - 24 * 60 * 60 * 1000;
    expect(isInsightFresh(exactly24h)).toBe(false);
  });
});

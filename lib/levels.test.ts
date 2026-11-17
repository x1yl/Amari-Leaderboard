import { describe, expect, it } from "vitest";

import {
  expToNextLevel,
  getLevelProgress,
  totalExpForLevel,
} from "@/lib/levels";

describe("totalExpForLevel", () => {
  it("matches Amari's published table", () => {
    expect(totalExpForLevel(0)).toBe(0);
    expect(totalExpForLevel(1)).toBe(35);
    expect(totalExpForLevel(2)).toBe(55);
    expect(totalExpForLevel(3)).toBe(115);
    expect(totalExpForLevel(10)).toBe(1_655);
    expect(totalExpForLevel(100)).toBe(196_055);
  });

  it("handles invalid levels without throwing", () => {
    expect(totalExpForLevel(Number.NaN)).toBe(0);
    expect(totalExpForLevel(-5)).toBe(0);
  });
});

describe("expToNextLevel", () => {
  it("returns the gap between consecutive levels", () => {
    expect(expToNextLevel(1)).toBe(20);
    expect(expToNextLevel(2)).toBe(60);
    expect(expToNextLevel(10)).toBe(380);
  });
});

describe("getLevelProgress", () => {
  it("calculates progress inside a level", () => {
    const progress = getLevelProgress(75, 2);
    expect(progress.percent).toBeCloseTo(33.333, 2);
    expect(progress.remaining).toBe(40);
    expect(progress.span).toBe(60);
  });

  it("clamps exp below and above the level window", () => {
    expect(getLevelProgress(0, 3).percent).toBe(0);
    expect(getLevelProgress(0, 3).remaining).toBe(215);
    expect(getLevelProgress(999_999, 3).percent).toBe(100);
    expect(getLevelProgress(999_999, 3).remaining).toBe(0);
  });

  it("never reports a span smaller than one", () => {
    const progress = getLevelProgress(10, 0);
    expect(progress.span).toBeGreaterThanOrEqual(1);
    expect(progress.percent).toBeGreaterThanOrEqual(0);
    expect(progress.percent).toBeLessThanOrEqual(100);
  });
});

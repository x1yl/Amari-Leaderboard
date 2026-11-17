import { describe, expect, it } from "vitest";

import { formatCompact, formatInitials, formatNumber } from "@/lib/format";

describe("formatNumber", () => {
  it("formats integers with grouping", () => {
    expect(formatNumber(8040)).toBe("8,040");
    expect(formatNumber(0)).toBe("0");
  });

  it("handles invalid and negative values", () => {
    expect(formatNumber(Number.NaN)).toBe("0");
    expect(formatNumber(-10)).toBe("0");
  });
});

describe("formatCompact", () => {
  it("uses compact notation", () => {
    expect(formatCompact(1_234)).toBe("1.2K");
    expect(formatCompact(1_000_000)).toBe("1M");
  });
});

describe("formatInitials", () => {
  it("uses the first letters of two words", () => {
    expect(formatInitials("balancing movie lights")).toBe("BM");
    expect(formatInitials("bthscord")).toBe("BT");
  });

  it("supports unicode names", () => {
    expect(formatInitials("rose_💫")).toBe("RO");
    expect(formatInitials("李 小龙")).toBe("李小");
  });

  it("falls back for empty or symbol-only names", () => {
    expect(formatInitials("")).toBe("?");
    expect(formatInitials("✨✨")).toBe("?");
  });
});

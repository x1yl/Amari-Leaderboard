import { describe, expect, it } from "vitest";

import {
  clampInt,
  isInviteCode,
  isLeaderboardPeriod,
  isSnowflake,
  parseServerInput,
} from "@/lib/validation";

describe("isSnowflake", () => {
  it("accepts 17-20 digit IDs", () => {
    expect(isSnowflake("835294705074962472")).toBe(true);
    expect(isSnowflake(" 12345678901234567 ")).toBe(true);
  });

  it("rejects short, long, and non-numeric values", () => {
    expect(isSnowflake("1234567890123456")).toBe(false);
    expect(isSnowflake("123456789012345678901")).toBe(false);
    expect(isSnowflake("83529470507496247a")).toBe(false);
    expect(isSnowflake("")).toBe(false);
  });
});

describe("isInviteCode", () => {
  it("accepts Discord invite codes", () => {
    expect(isInviteCode("RKPASf6")).toBe(true);
    expect(isInviteCode("my-server")).toBe(true);
  });

  it("rejects unsafe codes", () => {
    expect(isInviteCode("a")).toBe(false);
    expect(isInviteCode("bad/code")).toBe(false);
    expect(isInviteCode("bad code")).toBe(false);
  });
});

describe("parseServerInput", () => {
  it("parses server IDs", () => {
    expect(parseServerInput("835294705074962472")).toEqual({
      type: "id",
      guildId: "835294705074962472",
    });
  });

  it("parses discord.gg invite links with or without a scheme", () => {
    expect(parseServerInput("https://discord.gg/RKPASf6")).toEqual({
      type: "invite",
      code: "RKPASf6",
    });
    expect(parseServerInput("discord.gg/RKPASf6")).toEqual({
      type: "invite",
      code: "RKPASf6",
    });
    expect(parseServerInput("https://www.discord.gg/RKPASf6")).toEqual({
      type: "invite",
      code: "RKPASf6",
    });
  });

  it("parses discord.com/invite links", () => {
    expect(parseServerInput("https://discord.com/invite/RKPASf6")).toEqual({
      type: "invite",
      code: "RKPASf6",
    });
    expect(parseServerInput("discord.com/invite/RKPASf6")).toEqual({
      type: "invite",
      code: "RKPASf6",
    });
  });

  it("rejects unrelated or malformed input", () => {
    expect(parseServerInput("")).toBeNull();
    expect(parseServerInput("hello world")).toBeNull();
    expect(parseServerInput("https://example.com/invite/RKPASf6")).toBeNull();
    expect(parseServerInput("https://discord.gg/")).toBeNull();
    expect(parseServerInput("https://discord.gg/a")).toBeNull();
    expect(parseServerInput("javascript:alert(1)")).toBeNull();
  });
});

describe("clampInt", () => {
  it("clamps and truncates values", () => {
    expect(clampInt(5.9, 1, 10, 1)).toBe(5);
    expect(clampInt(0, 1, 10, 1)).toBe(1);
    expect(clampInt(99, 1, 10, 1)).toBe(10);
    expect(clampInt(Number.NaN, 1, 10, 7)).toBe(7);
    expect(clampInt(Infinity, 1, 10, 7)).toBe(7);
  });
});

describe("isLeaderboardPeriod", () => {
  it("only accepts all and weekly", () => {
    expect(isLeaderboardPeriod("all")).toBe(true);
    expect(isLeaderboardPeriod("weekly")).toBe(true);
    expect(isLeaderboardPeriod("monthly")).toBe(false);
  });
});

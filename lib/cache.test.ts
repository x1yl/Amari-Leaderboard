import { describe, expect, it } from "vitest";

import { clearCache, cached, peekCache } from "@/lib/cache";

describe("cached", () => {
  it("returns cached values within the TTL", async () => {
    clearCache();
    let calls = 0;
    const load = async () => {
      calls += 1;
      return { value: calls };
    };

    const first = await cached("key", { ttlMs: 60_000 }, load);
    const second = await cached("key", { ttlMs: 60_000 }, load);

    expect(first.value).toEqual({ value: 1 });
    expect(second.value).toEqual({ value: 1 });
    expect(first.stale).toBe(false);
    expect(second.stale).toBe(false);
    expect(calls).toBe(1);
  });

  it("de-duplicates concurrent loads (single flight)", async () => {
    clearCache();
    let calls = 0;
    let release: (value: string) => void = () => {};
    const gate = new Promise<string>((resolve) => {
      release = resolve;
    });

    const load = async () => {
      calls += 1;
      return gate;
    };

    const pending = [
      cached("single", { ttlMs: 60_000 }, load),
      cached("single", { ttlMs: 60_000 }, load),
      cached("single", { ttlMs: 60_000 }, load),
    ];

    // Let all three callers reach the in-flight map before resolving.
    await Promise.resolve();
    release("done");

    const results = await Promise.all(pending);
    expect(results.map((result) => result.value)).toEqual([
      "done",
      "done",
      "done",
    ]);
    expect(calls).toBe(1);
  });

  it("serves stale data when the loader fails inside the stale window", async () => {
    clearCache();
    let calls = 0;
    const load = async () => {
      calls += 1;
      if (calls === 1) return "fresh";
      throw new Error("upstream down");
    };

    const first = await cached(
      "stale",
      { ttlMs: 1, staleMs: 60_000 },
      load
    );
    await new Promise((resolve) => setTimeout(resolve, 5));

    const second = await cached(
      "stale",
      { ttlMs: 1, staleMs: 60_000 },
      load
    );

    expect(first.value).toBe("fresh");
    expect(second.value).toBe("fresh");
    expect(second.stale).toBe(true);
    expect(calls).toBe(2);
  });

  it("rethrows when no stale entry exists", async () => {
    clearCache();
    await expect(
      cached("boom", { ttlMs: 60_000 }, async () => {
        throw new Error("nope");
      })
    ).rejects.toThrow("nope");
  });

  it("exposes cached entries via peekCache", async () => {
    clearCache();
    expect(peekCache("peek")).toBeNull();
    await cached("peek", { ttlMs: 60_000 }, async () => 42);
    const peeking = peekCache<number>("peek");
    expect(peeking?.value).toBe(42);
  });
});

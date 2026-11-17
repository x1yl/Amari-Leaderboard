import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAllLeaderboard, getLeaderboardPage, getMemberStats } from "@/lib/amari";
import { clearCache } from "@/lib/cache";
import { resetUpstreamStateForTests } from "@/lib/upstream";

const GUILD = "835294705074962472";
const USER = "1235761712095957134";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  process.env.AMARI_API_KEY = "test-key";
  clearCache();
  resetUpstreamStateForTests();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetUpstreamStateForTests();
});

describe("getLeaderboardPage", () => {
  it("normalizes all-time rows and totals", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(async () =>
      jsonResponse({
        data: [
          {
            id: USER,
            username: "bthscord",
            exp: "196083",
            level: 100,
            weeklyExp: 15,
          },
        ],
        count: 1,
        total_count: 8040,
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const page = await getLeaderboardPage(GUILD, "all", 1, 100);

    expect(page.users).toEqual([
      {
        id: USER,
        username: "bthscord",
        exp: 196_083,
        level: 100,
        weeklyExp: 15,
      },
    ]);
    expect(page.totalCount).toBe(8040);
    expect(page.hasMore).toBe(true);
    expect(page.stale).toBe(false);

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain(`/guild/leaderboard/${GUILD}`);
    expect(url).toContain("page=1");
    expect(url).toContain("limit=100");
  });

  it("drops levels on weekly rows", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          data: [
            { id: USER, username: "bthscord", exp: 156237, level: 100 },
          ],
          count: 1,
          total_count: 6690,
        })
      )
    );

    const page = await getLeaderboardPage(GUILD, "weekly");

    expect(page.users[0]?.level).toBeNull();
    expect(page.users[0]?.weeklyExp).toBeNull();
    expect(page.users[0]?.exp).toBe(156_237);
  });

  it("computes hasMore without an extra empty page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          data: Array.from({ length: 100 }, (_, index) => ({
            id: `user-${index}`,
            username: `user-${index}`,
            exp: 100 - index,
            level: 10,
          })),
          total_count: 100,
        })
      )
    );

    const page = await getLeaderboardPage(GUILD, "all", 1, 100);
    expect(page.totalCount).toBe(100);
    expect(page.hasMore).toBe(false);
  });

  it("reports more pages when total_count exceeds the page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          data: Array.from({ length: 100 }, (_, index) => ({
            id: `user-${index}`,
            username: `user-${index}`,
            exp: 100 - index,
            level: 10,
          })),
          total_count: 8040,
        })
      )
    );

    const page = await getLeaderboardPage(GUILD, "all", 1, 100);
    expect(page.hasMore).toBe(true);
  });

  it("falls back to page-size detection when total_count is absent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          data: Array.from({ length: 5 }, (_, index) => ({
            id: `user-${index}`,
            username: `user-${index}`,
            exp: 5 - index,
            level: 1,
          })),
        })
      )
    );

    const page = await getLeaderboardPage(GUILD, "all", 1, 5);
    expect(page.hasMore).toBe(true);

    clearCache();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          data: Array.from({ length: 3 }, (_, index) => ({
            id: `user-${index}`,
            username: `user-${index}`,
            exp: 3 - index,
            level: 1,
          })),
        })
      )
    );

    const partial = await getLeaderboardPage(GUILD, "all", 1, 5);
    expect(partial.hasMore).toBe(false);
  });

  it("treats a 404 as the right not-found code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ error: "not found" }, 404)
      )
    );

    await expect(getLeaderboardPage(GUILD, "all")).rejects.toMatchObject({
      code: "not_found",
      status: 404,
    });
    await expect(getLeaderboardPage(GUILD, "weekly")).rejects.toMatchObject({
      code: "weekly_unavailable",
      status: 404,
    });
  });

  it("trips the circuit breaker on a 429", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "rate limited" }, 429))
    );

    await expect(getLeaderboardPage(GUILD, "all")).rejects.toMatchObject({
      code: "rate_limited",
      status: 503,
      retryAfter: 3600,
    });

    // The breaker should stop any follow-up request from touching Amari.
    await expect(getLeaderboardPage("999999999999999999", "all")).rejects.toMatchObject(
      { code: "rate_limited" }
    );
  });

  it("maps auth failures to config errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "unauthorized" }, 401))
    );

    await expect(getLeaderboardPage(GUILD, "all")).rejects.toMatchObject({
      code: "config",
    });
  });

  it("skips malformed rows and falls back for blank usernames", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          data: [
            { id: USER, username: "", exp: 100, level: 2 },
            { id: "bad-row", username: "invalid exp", exp: "nope" },
            {
              id: "217079120071229441",
              username: null,
              exp: "5",
              level: null,
              weeklyExp: null,
            },
          ],
          total_count: 2,
        })
      )
    );

    const page = await getLeaderboardPage(GUILD, "all", 1, 100);

    expect(page.users).toHaveLength(2);
    expect(page.users[0]).toMatchObject({
      id: USER,
      username: expect.stringMatching(/^User /),
      exp: 100,
      level: 2,
    });
    expect(page.users[1]).toMatchObject({
      id: "217079120071229441",
      username: expect.stringMatching(/^User /),
      exp: 5,
      level: null,
      weeklyExp: null,
    });
  });

  it("maps structurally invalid responses to upstream errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ data: "not-an-array" }))
    );

    await expect(getLeaderboardPage(GUILD, "all")).rejects.toMatchObject({
      code: "upstream",
    });
  });
});

describe("getAllLeaderboard", () => {
  it("loads the raw all-time board and merges weekly EXP by user ID", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/guild/raw/weekly/")) {
        return jsonResponse({
          data: [
            { id: "user-0", username: "player-0", exp: 42 },
            { id: "user-2", username: "player-2", exp: 7 },
          ],
          count: 2,
        });
      }
      if (url.includes("/guild/raw/leaderboard/")) {
        return jsonResponse({
          data: Array.from({ length: 3 }, (_, index) => ({
            id: `user-${index}`,
            username: `player-${index}`,
            exp: 100 - index,
            level: 10,
            weeklyExp: null,
          })),
          count: 3,
        });
      }
      return jsonResponse({ error: "unexpected url" }, 500);
    });
    vi.stubGlobal("fetch", fetchMock);

    const data = await getAllLeaderboard(GUILD, "all");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(
      data.users.map((user) => [user.id, user.exp, user.level, user.weeklyExp])
    ).toEqual([
      ["user-0", 100, 10, 42],
      ["user-1", 99, 10, 0],
      ["user-2", 98, 10, 7],
    ]);
    expect(data.totalCount).toBe(3);
    expect(data.truncated).toBe(false);
  });

  it("loads a raw weekly board in one request", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toContain(`/guild/raw/weekly/${GUILD}`);
      return jsonResponse({
        data: [
          { id: USER, username: "bthscord", exp: 156_237, level: 100 },
        ],
        count: 1,
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const data = await getAllLeaderboard(GUILD, "weekly");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(data.users).toEqual([
      {
        id: USER,
        username: "bthscord",
        exp: 156_237,
        level: null,
        weeklyExp: null,
      },
    ]);
    expect(data.totalCount).toBe(1);
  });

  it("falls back to pagination when the raw endpoints fail", async () => {
    let paginationCall = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/raw/")) {
        return jsonResponse({ error: "unavailable" }, 500);
      }

      paginationCall += 1;
      const rows =
        paginationCall === 1
          ? Array.from({ length: 1000 }, (_, index) => ({
              id: `early-${index}`,
              username: `player-${index}`,
              exp: 1000 - index,
              level: 50,
              weeklyExp: index,
            }))
          : Array.from({ length: 500 }, (_, index) => ({
              id: `late-${index}`,
              username: `late-${index}`,
              exp: 10 - index,
              level: 2,
              weeklyExp: 0,
            }));
      return jsonResponse({ data: rows, count: rows.length, total_count: 1500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const data = await getAllLeaderboard(GUILD, "all");

    // Two failed raw requests, then two paginated requests.
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(data.users).toHaveLength(1500);
    expect(data.users[1]).toMatchObject({ weeklyExp: 1 });
    expect(data.totalCount).toBe(1500);
    expect(data.truncated).toBe(false);
  });

  it("stops paginating when an empty page is returned", async () => {
    let paginationCall = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/raw/")) {
        return jsonResponse({ error: "unavailable" }, 500);
      }

      paginationCall += 1;
      return jsonResponse({
        data:
          paginationCall === 1
            ? [{ id: USER, username: "one", exp: 1, level: 1 }]
            : [],
        count: paginationCall === 1 ? 1 : 0,
        total_count: 5000,
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const data = await getAllLeaderboard(GUILD, "all");

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(data.users).toHaveLength(1);
    expect(data.truncated).toBe(false);
  });
});

describe("getMemberStats", () => {
  it("normalizes member rows", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          id: USER,
          username: "bthscord",
          exp: 196_083,
          level: 100,
          weeklyExp: 15,
        })
      )
    );

    await expect(getMemberStats(GUILD, USER)).resolves.toEqual({
      id: USER,
      username: "bthscord",
      exp: 196_083,
      level: 100,
      weeklyExp: 15,
    });
  });

  it("treats a missing member as member_not_found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "missing" }, 404))
    );

    await expect(getMemberStats(GUILD, USER)).rejects.toMatchObject({
      code: "member_not_found",
      status: 404,
    });
  });
});

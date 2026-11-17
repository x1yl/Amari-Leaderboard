import { z } from "zod";

import { cached } from "@/lib/cache";
import { AppError } from "@/lib/errors";
import { clampInt } from "@/lib/validation";
import { assertUpstreamAvailable, takeUpstreamSlot, tripCircuitBreaker } from "@/lib/upstream";
import type {
  AllLeaderboardData,
  LeaderboardPageData,
  LeaderboardPeriod,
  LeaderboardUser,
  MemberStats,
} from "@/lib/types";

const API_BASE = "https://amaribot.com/api/v1";
const PAGE_TTL_MS = 5 * 60 * 1000;
const PAGE_STALE_MS = 24 * 60 * 60 * 1000;
const MEMBER_TTL_MS = 2 * 60 * 1000;
const MAX_ALL_PAGES = 20;
const ALL_PAGE_SIZE = 1_000;

const numberish = z
  .union([z.number(), z.string()])
  .transform((value) => Number(value))
  .refine((value) => Number.isFinite(value), "Expected a finite number");

const optionalNumberish = z
  .union([z.number(), z.string(), z.null()])
  .transform((value) => (value === null ? undefined : Number(value)))
  .refine(
    (value) => value === undefined || Number.isFinite(value),
    "Expected a finite number"
  );

const idish = z
  .union([z.string(), z.number()])
  .transform((value) => String(value))
  .refine((value) => value.trim().length > 0, "Expected an id");

// Amari occasionally returns blank usernames for deleted/unknown accounts.
const usernameish = z
  .union([z.string(), z.null()])
  .transform((value) => value ?? "");

const userSchema = z.object({
  id: idish,
  username: usernameish.optional(),
  exp: numberish,
  level: optionalNumberish.optional(),
  weeklyExp: optionalNumberish.optional(),
});

const leaderboardSchema = z.object({
  data: z.array(z.unknown()),
  count: numberish.optional(),
  total_count: numberish.optional(),
});

const memberSchema = z.object({
  id: idish,
  username: usernameish.optional(),
  exp: numberish,
  level: optionalNumberish.optional(),
  weeklyExp: optionalNumberish.optional(),
});

function displayUsername(username: string, id: string): string {
  const trimmed = username.trim();
  return trimmed || `User ${id.slice(-4)}`;
}

function parseOrUpstream<T extends z.ZodTypeAny>(
  schema: T,
  raw: unknown
): z.infer<T> {
  try {
    return schema.parse(raw);
  } catch (error) {
    throw new AppError("upstream", { cause: error });
  }
}

function apiKey(): string {
  const key = process.env.AMARI_API_KEY?.trim();
  if (!key) {
    throw new AppError("config", {
      message:
        "The leaderboard service isn't configured on this deployment. Please try again later.",
    });
  }
  return key;
}

async function amariRequest(
  path: string,
  params: Record<string, string | number | undefined>,
  notFoundCode: "not_found" | "weekly_unavailable" | "member_not_found"
): Promise<unknown> {
  const key = apiKey();
  assertUpstreamAvailable();
  takeUpstreamSlot();

  const url = new URL(`${API_BASE}${path}`);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(name, String(value));
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: key,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch (error) {
    const name = (error as { name?: string } | null)?.name;
    if (name === "TimeoutError" || name === "AbortError") {
      throw new AppError("timeout", { cause: error });
    }
    throw new AppError("upstream", { cause: error });
  }

  if (response.status === 429) {
    tripCircuitBreaker();
    throw new AppError("rate_limited", {
      retryAfter: 60 * 60,
      cause: new Error("Amari returned 429"),
    });
  }

  if (response.status === 401 || response.status === 403) {
    throw new AppError("config", {
      message:
        "The leaderboard service rejected its credentials. Please try again later.",
    });
  }

  if (response.status === 404) {
    throw new AppError(notFoundCode);
  }

  if (!response.ok) {
    throw new AppError("upstream", {
      cause: new Error(`Amari responded with ${response.status}`),
    });
  }

  try {
    return await response.json();
  } catch (error) {
    throw new AppError("upstream", { cause: error });
  }
}

function normalizeUser(
  user: z.infer<typeof userSchema>,
  period: LeaderboardPeriod
): LeaderboardUser {
  return {
    id: user.id,
    username: displayUsername(user.username ?? "", user.id),
    exp: Math.max(0, Math.trunc(user.exp)),
    level:
      period === "weekly"
        ? null
        : user.level === undefined
          ? null
          : Math.max(0, Math.trunc(user.level)),
    weeklyExp: user.weeklyExp === undefined ? null : Math.max(0, Math.trunc(user.weeklyExp)),
  };
}

function normalizeRows(
  rows: unknown[],
  period: LeaderboardPeriod,
  context: string
): LeaderboardUser[] {
  const users: LeaderboardUser[] = [];
  let skipped = 0;

  for (const row of rows) {
    const parsed = userSchema.safeParse(row);
    if (!parsed.success) {
      skipped += 1;
      continue;
    }
    users.push(normalizeUser(parsed.data, period));
  }

  if (skipped > 0) {
    console.warn(`${context}: skipped ${skipped} malformed row(s)`);
  }

  return users;
}

export async function getLeaderboardPage(
  guildId: string,
  period: LeaderboardPeriod,
  page = 1,
  limit = 100
): Promise<LeaderboardPageData> {
  const safePage = clampInt(page, 1, 10_000, 1);
  const safeLimit = clampInt(limit, 1, 1_000, 100);
  const cacheKey = `amari:${period}:${guildId}:${safePage}:${safeLimit}`;

  const result = await cached(
    cacheKey,
    { ttlMs: PAGE_TTL_MS, staleMs: PAGE_STALE_MS },
    async () => {
      const path =
        period === "weekly"
          ? `/guild/weekly/${guildId}`
          : `/guild/leaderboard/${guildId}`;

      const raw = await amariRequest(
        path,
        { page: safePage, limit: safeLimit },
        period === "weekly" ? "weekly_unavailable" : "not_found"
      );

      const normalized = Array.isArray(raw)
        ? parseOrUpstream(leaderboardSchema, { data: raw })
        : parseOrUpstream(leaderboardSchema, raw);

      const users = normalizeRows(
        normalized.data,
        period,
        `Amari ${period} leaderboard ${guildId} page ${safePage}`
      );

      const knownTotal = normalized.total_count;
      const totalCount = Math.max(knownTotal ?? users.length, users.length);
      const consumed = (safePage - 1) * safeLimit + users.length;

      return {
        users,
        count: normalized.count ?? users.length,
        totalCount,
        page: safePage,
        limit: safeLimit,
        hasMore:
          knownTotal !== undefined
            ? consumed < knownTotal
            : users.length >= safeLimit,
      };
    }
  );

  return {
    ...result.value,
    fetchedAt: result.fetchedAt,
    stale: result.stale,
  };
}

interface RawLeaderboardData {
  users: LeaderboardUser[];
  totalCount: number;
}

/**
 * Amari's raw endpoints return a whole board in one response. They are much
 * cheaper than walking paginated endpoints (2 requests instead of 9 for a
 * 8k-player server), but the raw all-time rows have `weeklyExp: null`. The
 * caller merges the raw weekly board back in to recover that annotation.
 */
async function fetchRawLeaderboard(
  guildId: string,
  period: LeaderboardPeriod
): Promise<RawLeaderboardData> {
  const path =
    period === "weekly"
      ? `/guild/raw/weekly/${guildId}`
      : `/guild/raw/leaderboard/${guildId}`;

  const raw = await amariRequest(
    path,
    {},
    period === "weekly" ? "weekly_unavailable" : "not_found"
  );

  const normalized = Array.isArray(raw)
    ? parseOrUpstream(leaderboardSchema, { data: raw })
    : parseOrUpstream(leaderboardSchema, raw);

  const users = normalizeRows(
    normalized.data,
    period,
    `Amari raw ${period} leaderboard ${guildId}`
  );

  const declared = normalized.total_count ?? normalized.count;

  return {
    users,
    totalCount: Math.max(
      declared === undefined ? users.length : Math.trunc(declared),
      users.length
    ),
  };
}

/**
 * The weekly raw board is cached because it doubles as both the weekly full
 * board and the source of the all-time weekly annotation. The all-time raw
 * snapshot is not cached separately; the merged result is cached by
 * getAllLeaderboard, which avoids keeping three full copies of a large board
 * in memory.
 */
function getCachedRawWeeklyLeaderboard(guildId: string) {
  return cached<RawLeaderboardData>(
    `amari:weekly:${guildId}:raw`,
    { ttlMs: PAGE_TTL_MS, staleMs: PAGE_STALE_MS },
    () => fetchRawLeaderboard(guildId, "weekly")
  );
}

async function loadRawSnapshot(guildId: string, period: LeaderboardPeriod) {
  if (period === "weekly") {
    const weekly = await getCachedRawWeeklyLeaderboard(guildId);
    return {
      users: weekly.value.users,
      totalCount: weekly.value.totalCount,
      truncated: false,
      stale: weekly.stale,
      fetchedAt: weekly.fetchedAt,
    };
  }

  const startedAt = Date.now();
  const [all, weekly] = await Promise.all([
    fetchRawLeaderboard(guildId, "all"),
    getCachedRawWeeklyLeaderboard(guildId),
  ]);

  const weeklyById = new Map<string, number>();
  for (const user of weekly.value.users) {
    weeklyById.set(user.id, user.exp);
  }

  // Raw all-time rows carry weeklyExp: null, so join the weekly board by user
  // ID. Players without a weekly row have no weekly EXP (0), which matches
  // what the paginated all-time endpoint reports for inactive players.
  const users = all.users.map((user) => ({
    ...user,
    weeklyExp: weeklyById.get(user.id) ?? 0,
  }));

  return {
    users,
    totalCount: Math.max(all.totalCount, users.length),
    truncated: false,
    stale: weekly.stale,
    fetchedAt: Math.min(startedAt, weekly.fetchedAt),
  };
}

async function paginateAllLeaderboard(
  guildId: string,
  period: LeaderboardPeriod
): Promise<{
  users: LeaderboardUser[];
  totalCount: number;
  truncated: boolean;
  stale: boolean;
  fetchedAt: number;
}> {
  const users: LeaderboardUser[] = [];
  let totalCount = 0;
  let page = 1;
  let truncated = false;
  let stale = false;
  let fetchedAt = Date.now();

  while (page <= MAX_ALL_PAGES) {
    const pageData = await getLeaderboardPage(
      guildId,
      period,
      page,
      ALL_PAGE_SIZE
    );

    totalCount = pageData.totalCount;
    users.push(...pageData.users);
    stale = stale || pageData.stale;
    fetchedAt = Math.min(fetchedAt, pageData.fetchedAt);

    if (pageData.users.length === 0 || users.length >= totalCount) {
      break;
    }

    // The requested page size may be larger than Amari's actual maximum;
    // keep going until total_count is reached, a page is empty, or our
    // safety cap is hit.
    page += 1;
    if (page > MAX_ALL_PAGES) {
      truncated = true;
    }
  }

  if (users.length < totalCount && page > MAX_ALL_PAGES) {
    truncated = true;
  }

  return {
    users,
    totalCount: Math.max(totalCount, users.length),
    truncated,
    stale,
    fetchedAt,
  };
}

export async function getAllLeaderboard(
  guildId: string,
  period: LeaderboardPeriod
): Promise<AllLeaderboardData> {
  const cacheKey = `amari:${period}:${guildId}:all`;

  const result = await cached(
    cacheKey,
    { ttlMs: PAGE_TTL_MS, staleMs: PAGE_STALE_MS },
    async () => {
      try {
        const snapshot = await loadRawSnapshot(guildId, period);
        return {
          users: snapshot.users,
          totalCount: snapshot.totalCount,
          truncated: snapshot.truncated,
          sourceStale: snapshot.stale,
          sourceFetchedAt: snapshot.fetchedAt,
        };
      } catch (error) {
        // Never retry into a rate-limit lockout or a configuration failure.
        // Everything else (raw endpoint missing, malformed payload, timeout)
        // falls back to the paginated path this app has always used.
        if (
          error instanceof AppError &&
          (error.code === "rate_limited" ||
            error.code === "config" ||
            error.code === "budget")
        ) {
          throw error;
        }

        console.warn(
          `Amari raw ${period} leaderboard ${guildId} unavailable; falling back to pagination`,
          error
        );

        const fallback = await paginateAllLeaderboard(guildId, period);
        return {
          ...fallback,
          sourceStale: fallback.stale,
          sourceFetchedAt: fallback.fetchedAt,
        };
      }
    }
  );

  return {
    users: result.value.users,
    totalCount: result.value.totalCount,
    truncated: result.value.truncated,
    fetchedAt: Math.min(result.fetchedAt, result.value.sourceFetchedAt),
    stale: result.stale || result.value.sourceStale,
  };
}

export async function getMemberStats(
  guildId: string,
  userId: string
): Promise<MemberStats> {
  const cacheKey = `amari:member:${guildId}:${userId}`;

  const result = await cached(
    cacheKey,
    { ttlMs: MEMBER_TTL_MS, staleMs: 10 * 60 * 1000 },
    async () => {
      const raw = await amariRequest(
        `/guild/${guildId}/member/${userId}`,
        {},
        "member_not_found"
      );
      const parsed = parseOrUpstream(memberSchema, raw);

      return {
        id: parsed.id,
        username: displayUsername(parsed.username ?? "", parsed.id),
        exp: Math.max(0, Math.trunc(parsed.exp)),
        level: Math.max(0, Math.trunc(parsed.level ?? 0)),
        weeklyExp:
          parsed.weeklyExp === undefined
            ? 0
            : Math.max(0, Math.trunc(parsed.weeklyExp)),
      };
    }
  );

  return result.value;
}

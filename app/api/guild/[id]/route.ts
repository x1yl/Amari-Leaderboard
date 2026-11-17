import { NextResponse } from "next/server";

import { getAllLeaderboard, getLeaderboardPage } from "@/lib/amari";
import { getGuildInfo } from "@/lib/discord";
import { AppError, publicError } from "@/lib/errors";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import type { GuildInfo } from "@/lib/types";
import { isLeaderboardPeriod, isSnowflake } from "@/lib/validation";

export const dynamic = "force-dynamic";

const FALLBACK_GUILD: (id: string) => GuildInfo = (id) => ({
  id,
  name: null,
  iconUrl: null,
  onlineCount: null,
  memberCount: null,
  widgetEnabled: false,
});

function errorResponse(error: unknown) {
  const details = publicError(error);
  if (!["invalid_input", "not_found", "weekly_unavailable"].includes(details.code)) {
    console.error("Leaderboard API error:", details.code, error);
  }

  return NextResponse.json(
    { error: details },
    {
      status: details.status,
      headers: {
        "Cache-Control": "no-store",
        ...(details.retryAfter
          ? { "Retry-After": String(details.retryAfter) }
          : {}),
      },
    }
  );
}

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const guildId = context.params.id;
  const url = new URL(request.url);
  const periodParam = url.searchParams.get("period") ?? "all";
  const all = url.searchParams.get("all") === "1";
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = Number(url.searchParams.get("limit") ?? "100");

  if (!isSnowflake(guildId)) {
    return errorResponse(new AppError("invalid_input"));
  }

  if (!isLeaderboardPeriod(periodParam)) {
    return errorResponse(new AppError("invalid_input"));
  }

  const limitResult = checkRateLimit(
    `guild:${clientKey(request)}`,
    all ? 20 : 120
  );
  if (!limitResult.ok) {
    return NextResponse.json(
      {
        error: {
          code: "rate_limited",
          message:
            "You're opening leaderboards a little too quickly. Wait a moment and try again.",
        },
      },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(
            Math.max(1, Math.ceil((limitResult.resetAt - Date.now()) / 1000))
          ),
        },
      }
    );
  }

  try {
    const guildPromise = getGuildInfo(guildId).catch(() => FALLBACK_GUILD(guildId));

    if (all) {
      const [guild, data] = await Promise.all([
        guildPromise,
        getAllLeaderboard(guildId, periodParam),
      ]);

      return NextResponse.json(
        {
          guild,
          period: periodParam,
          users: data.users,
          count: data.users.length,
          totalCount: data.totalCount,
          page: 1,
          limit: data.users.length,
          hasMore: false,
          allLoaded: true,
          truncated: data.truncated,
          fetchedAt: data.fetchedAt,
          stale: data.stale,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
          },
        }
      );
    }

    const [guild, data] = await Promise.all([
      guildPromise,
      getLeaderboardPage(guildId, periodParam, page, limit),
    ]);

    return NextResponse.json(
      {
        guild,
        period: periodParam,
        users: data.users,
        count: data.count,
        totalCount: data.totalCount,
        page: data.page,
        limit: data.limit,
        hasMore: data.hasMore,
        allLoaded: false,
        fetchedAt: data.fetchedAt,
        stale: data.stale,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=900",
        },
      }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

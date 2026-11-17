import { NextResponse } from "next/server";

import { getMemberStats } from "@/lib/amari";
import { AppError, publicError } from "@/lib/errors";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { isSnowflake } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: { id: string; userId: string } }
) {
  const { id: guildId, userId } = context.params;

  if (!isSnowflake(guildId) || !isSnowflake(userId)) {
    const details = publicError(new AppError("invalid_input"));
    return NextResponse.json({ error: details }, { status: details.status });
  }

  const limitResult = checkRateLimit(
    `member:${clientKey(request)}`,
    60,
    60_000
  );
  if (!limitResult.ok) {
    return NextResponse.json(
      {
        error: {
          code: "rate_limited",
          message: "Too many lookups. Please wait a moment and try again.",
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(1, Math.ceil((limitResult.resetAt - Date.now()) / 1000))
          ),
        },
      }
    );
  }

  try {
    const member = await getMemberStats(guildId, userId);
    return NextResponse.json(
      { member },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=120, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    const details = publicError(error);
    if (!["invalid_input", "member_not_found"].includes(details.code)) {
      console.error("Member API error:", details.code, error);
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
}

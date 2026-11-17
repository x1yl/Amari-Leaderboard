import { NextResponse } from "next/server";

import { resolveServerInput } from "@/lib/discord";
import { AppError, publicError } from "@/lib/errors";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const input = new URL(request.url).searchParams.get("input")?.trim() ?? "";

  if (!input) {
    const details = publicError(new AppError("invalid_input"));
    return NextResponse.json({ error: details }, { status: details.status });
  }

  const limitResult = checkRateLimit(
    `resolve:${clientKey(request)}`,
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
    const resolved = await resolveServerInput(input);
    return NextResponse.json(
      {
        guildId: resolved.guildId,
        guild: resolved.info,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    const details = publicError(error);
    if (details.code !== "invalid_input" && details.code !== "not_found") {
      console.error("Resolve API error:", details.code, error);
    }
    return NextResponse.json(
      { error: details },
      {
        status: details.status,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}

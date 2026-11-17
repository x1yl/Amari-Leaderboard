const SNOWFLAKE = /^\d{17,20}$/;
const INVITE_CODE = /^[a-zA-Z0-9-]{2,32}$/;

export function isSnowflake(value: string): boolean {
  return SNOWFLAKE.test(value.trim());
}

export function isInviteCode(value: string): boolean {
  return INVITE_CODE.test(value.trim());
}

export type ParsedServerInput =
  | { type: "id"; guildId: string }
  | { type: "invite"; code: string };

/**
 * Accepts a Discord server ID, a discord.gg invite, or a discord.com/invite
 * URL. Returns null for anything else. Never trust the raw input as a URL.
 */
export function parseServerInput(raw: string): ParsedServerInput | null {
  const input = raw.trim();

  if (!input) return null;
  if (isSnowflake(input)) return { type: "id", guildId: input };

  let candidate = input;
  if (!candidate.startsWith("http")) {
    candidate = `https://${candidate}`;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const segments = url.pathname.split("/").filter(Boolean);

  let code: string | undefined;

  if (host === "discord.gg" || host === "discordapp.com" || host === "discord.com") {
    if (segments[0] === "invite") {
      code = segments[1];
    } else if (host === "discord.gg") {
      code = segments[0];
    }
  }

  if (!code || !isInviteCode(code)) return null;
  return { type: "invite", code };
}

export function clampInt(
  value: number,
  min: number,
  max: number,
  fallback: number
): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function isLeaderboardPeriod(value: string): value is "all" | "weekly" {
  return value === "all" || value === "weekly";
}

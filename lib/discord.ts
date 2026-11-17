import { cached } from "@/lib/cache";
import { AppError } from "@/lib/errors";
import { parseServerInput } from "@/lib/validation";
import type { GuildInfo } from "@/lib/types";

const GUILD_TTL_MS = 24 * 60 * 60 * 1000;
const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

interface InviteResponse {
  code?: string;
  guild?: {
    id?: string;
    name?: string;
    icon?: string | null;
    description?: string | null;
  } | null;
  approximate_member_count?: number;
  approximate_presence_count?: number;
}

interface WidgetResponse {
  id?: string;
  name?: string;
  instant_invite?: string | null;
  presence_count?: number;
}

interface BotGuildResponse {
  id?: string;
  name?: string;
  icon?: string | null;
  approximate_member_count?: number;
  approximate_presence_count?: number;
}

function iconUrl(guildId: string, icon: string | null | undefined): string | null {
  if (!icon) return null;
  const extension = icon.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${extension}?size=256`;
}

async function discordJson<T>(url: string, headers?: HeadersInit): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(6_000),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getInviteInfo(code: string): Promise<GuildInfo> {
  const cacheKey = `discord:invite:${code}`;

  const result = await cached(
    cacheKey,
    { ttlMs: INVITE_TTL_MS, staleMs: 7 * 24 * 60 * 60 * 1000 },
    async () => {
      const invite = await discordJson<InviteResponse>(
        `https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true&with_expiration=false`
      );

      if (!invite) {
        throw new AppError("not_found", {
          message:
            "We couldn't resolve that invite link. Check the link or paste the server ID instead.",
        });
      }

      const guildId = invite.guild?.id ?? "";
      if (!guildId) {
        throw new AppError("not_found", {
          message: "That invite doesn't point to a Discord server.",
        });
      }

      return {
        id: guildId,
        name: invite.guild?.name ?? null,
        iconUrl: iconUrl(guildId, invite.guild?.icon),
        onlineCount: invite.approximate_presence_count ?? null,
        memberCount: invite.approximate_member_count ?? null,
        widgetEnabled: true,
      } satisfies GuildInfo;
    }
  );

  return result.value;
}

export async function getGuildInfo(guildId: string): Promise<GuildInfo> {
  const cacheKey = `discord:guild:${guildId}`;

  const result = await cached(
    cacheKey,
    { ttlMs: GUILD_TTL_MS, staleMs: 7 * 24 * 60 * 60 * 1000 },
    async () => {
      const fallback: GuildInfo = {
        id: guildId,
        name: null,
        iconUrl: null,
        onlineCount: null,
        memberCount: null,
        widgetEnabled: false,
      };

      const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
      if (botToken) {
        const botGuild = await discordJson<BotGuildResponse>(
          `https://discord.com/api/v10/guilds/${guildId}?with_counts=true`,
          { Authorization: `Bot ${botToken}` }
        );
        if (botGuild?.id) {
          return {
            id: guildId,
            name: botGuild.name ?? null,
            iconUrl: iconUrl(guildId, botGuild.icon),
            onlineCount: botGuild.approximate_presence_count ?? null,
            memberCount: botGuild.approximate_member_count ?? null,
            widgetEnabled: true,
          } satisfies GuildInfo;
        }
      }

      const widget = await discordJson<WidgetResponse>(
        `https://discord.com/api/guilds/${guildId}/widget.json`
      );

      if (!widget) return fallback;

      let name = widget.name ?? null;
      let icon: string | null = null;
      let memberCount: number | null = null;

      if (widget.instant_invite) {
        const code = widget.instant_invite.split("/").filter(Boolean).pop();
        if (code) {
          const invite = await discordJson<InviteResponse>(
            `https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true&with_expiration=false`
          );
          if (invite?.guild?.id) {
            name = invite.guild.name ?? name;
            icon = iconUrl(invite.guild.id, invite.guild.icon);
            memberCount = invite.approximate_member_count ?? null;
          }
        }
      }

      return {
        id: guildId,
        name,
        iconUrl: icon,
        onlineCount: widget.presence_count ?? null,
        memberCount,
        widgetEnabled: true,
      } satisfies GuildInfo;
    }
  );

  return result.value;
}

export async function resolveServerInput(
  raw: string
): Promise<{ guildId: string; info: GuildInfo }> {
  const parsed = parseServerInput(raw);
  if (!parsed) {
    throw new AppError("invalid_input");
  }

  if (parsed.type === "id") {
    const info = await getGuildInfo(parsed.guildId);
    return { guildId: parsed.guildId, info };
  }

  const info = await getInviteInfo(parsed.code);
  return { guildId: info.id, info };
}

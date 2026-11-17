const FALLBACK_SITE_URL = "https://amari-leaderboard.vercel.app";

/**
 * Normalizes NEXT_PUBLIC_SITE_URL so metadata, robots, sitemap and canonical
 * URLs never gain a double slash or an invalid origin.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK_SITE_URL;

  try {
    return new URL(raw).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export function getSiteHost(): string {
  try {
    return new URL(getSiteUrl()).host;
  } catch {
    return new URL(FALLBACK_SITE_URL).host;
  }
}

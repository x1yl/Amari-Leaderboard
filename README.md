# Amari Leaderboard

An unofficial, no-login viewer for [Amari](https://amaribot.com) Discord leaderboards. Paste a server ID or invite link to see all-time and weekly rankings, search players, look up an exact Discord user ID, and share the result.

> This project is not affiliated with, endorsed by, or operated by Amari.

## Features

- **All-time and weekly leaderboards** from the Amari API.
- **Server lookup by ID or invite link** (`discord.gg/...`, `discord.com/invite/...`).
- **Exact player lookup** by Discord user ID, including players outside the loaded page.
- **Search and sort** loaded players, with an option to load the full leaderboard.
- **Infinite scroll with a fallback button**, plus paginated API responses.
- **Level progress** calculated from Amari's published EXP table.
- **Shareable URLs** that preserve period, query, sort, and highlighted player.
- **Rate-limit-safe data layer**: in-memory TTL cache, request de-duplication, stale-if-error, an upstream budget, and a circuit breaker.
- **Metadata, Open Graph images, sitemap, robots, and PWA manifest**.
- **Accessible states** for loading, empty, stale, truncated, invalid, and not-found results.
- **Mobile-first player rows** with deterministic local avatars (Amari does not expose avatar hashes).

## Tech stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS with a dark "Focused arena" theme
- Radix Dialog, Lucide icons
- Zod for upstream response validation
- Vitest for unit tests

## Getting started

```bash
pnpm install
cp .env.example .env
# add your Amari API key to .env
pnpm dev
```

Open <http://localhost:3000>.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `AMARI_API_KEY` | Yes | Amari API key used by server routes. Never exposed to the browser. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Public origin used for metadata, canonical URLs, sitemap, and robots. |
| `DISCORD_BOT_TOKEN` | Optional | Lets server identity resolve for guilds that hide their Discord widget. The bot only needs to be in the guild. |

If `DISCORD_BOT_TOKEN` is absent, the app falls back to the public Discord widget and invite APIs. When a server hides its widget and has no usable invite, the leaderboard still works but the server name/icon fall back to neutral placeholders.

## Scripts

```bash
pnpm dev         # start the dev server
pnpm build       # production build
pnpm start       # serve the production build
pnpm lint        # ESLint
pnpm typecheck   # tsc --noEmit
pnpm test        # Vitest (single run)
pnpm test:watch  # Vitest watch mode
```

## API routes

| Route | Description |
| --- | --- |
| `GET /api/guild/:id` | Leaderboard page. Query: `period=all\|weekly`, `page`, `limit` (max 1000), or `all=1` for the full list. |
| `GET /api/guild/:id/member/:userId` | Exact member stats by Discord user ID. |
| `GET /api/resolve?input=` | Resolve a server ID or invite link to a guild ID and identity. |

Responses include `fetchedAt` and `stale` so the UI can show data freshness. Success responses send CDN cache headers; errors are `no-store`.

### Full-board loads

`all=1` uses Amari's raw endpoints instead of walking every page:

- **All-time:** `/guild/raw/leaderboard/:guild` plus `/guild/raw/weekly/:guild`, fetched in parallel. The weekly board is joined by user ID to restore the per-player `weeklyExp` annotation, which the raw all-time rows return as `null`. Players without a weekly row get `0`, matching the paginated endpoint.
- **Weekly:** `/guild/raw/weekly/:guild` on its own.

That is **2 upstream requests** for a full all-time board (and 1 for weekly) instead of 9 paginated requests for an 8k-player server. If a raw endpoint fails, the data layer logs the failure and falls back to pagination automatically; `429`, configuration, and budget errors are never retried.

## How the rate limits are handled

Amari allows **60 requests per minute**, and a single `429` can trigger a **60-minute lockout**. The data layer is designed to avoid that:

1. **TTL cache** — leaderboard pages (5 min), members (2 min), guild identity (24 h).
2. **Single-flight** — concurrent requests for the same cache key share one upstream call.
3. **Stale-if-error** — if Amari fails, the last good value can still be served.
4. **Upstream budget** — at most **45** upstream requests per minute, leaving headroom.
5. **Circuit breaker** — a `429` blocks further upstream calls for 60 minutes.
6. **CDN headers** — `s-maxage` and `stale-while-revalidate` absorb repeat traffic.

The cache is in memory, so serverless deployments get one cache per instance. For heavier traffic, put a shared cache (Redis) in front of `lib/cache.ts`.

## Level formula

Amari's published total-EXP thresholds are:

- Level 1: `35`
- Level `L` (for `L >= 2`): `20 * (L - 1)^2 + 35`

`lib/levels.ts` clamps progress so unusual rows can never render a negative or overflowing bar.

## Project structure

```
app/
  api/                  server routes (leaderboard, member, resolve)
  leaderboard/[id]/     server page, metadata, loading, OG image
components/
  home/                 landing page and lookup
  leaderboard/          board, podium, rows, dialogs, states
  ui/                   dialog, badge, skeleton
lib/
  amari.ts              Amari endpoints and normalization
  cache.ts              TTL cache, single-flight, stale-if-error
  discord.ts            guild/invite identity resolution
  upstream.ts           request budget and circuit breaker
  rate-limit.ts         per-client request limiting
  levels.ts             level/EXP math
  validation.ts         input parsing and guards
  ...                   types, errors, formatting, avatars, recents
```

## Testing

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Unit tests cover level math, input validation, formatting, error mapping, the cache (TTL, single-flight, stale fallback), and Amari response normalization, pagination, and error handling.

## Deployment

The app is a standard Next.js project and deploys to Vercel or any Node host. Set `AMARI_API_KEY` and `NEXT_PUBLIC_SITE_URL` in the hosting environment. Do not commit `.env` files.

## Disclaimer

Data is provided by the Amari API. This is an unofficial fan project and is not affiliated with Amari or Discord.

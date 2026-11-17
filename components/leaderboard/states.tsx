"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CalendarX2,
  Clock3,
  RefreshCw,
  SearchX,
  ServerOff,
  UserX,
  WifiOff,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, formatNumber } from "@/lib/format";
import type { LeaderboardPeriod } from "@/lib/types";

export function StaleBanner({
  fetchedAt,
  onRefresh,
}: {
  fetchedAt: number | null;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gold/20 bg-gold/[0.06] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-gold/90">
        <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Showing cached data{fetchedAt ? ` from ${formatRelativeTime(fetchedAt)}` : ""}.
          Amari couldn&apos;t be reached for a refresh, so this is the last good
          copy.
        </span>
      </p>
      <button type="button" onClick={onRefresh} className="arena-button-secondary h-8 px-3 text-xs">
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}

interface ErrorStateProps {
  code: string;
  message: string;
  period: LeaderboardPeriod;
  onRetry: () => void;
  onAllTime: () => void;
}

const errorMeta: Record<
  string,
  { title: string; icon: typeof AlertTriangle; hint?: string }
> = {
  invalid_input: {
    title: "That server ID doesn't look right",
    icon: AlertTriangle,
    hint: "Discord server IDs are 17–20 digits. You can also paste an invite link.",
  },
  not_found: {
    title: "Server not found in Amari",
    icon: ServerOff,
    hint: "Make sure Amari is in the server and that the ID is correct.",
  },
  weekly_unavailable: {
    title: "Weekly leaderboard unavailable",
    icon: CalendarX2,
    hint: "This server may not have weekly leaderboards enabled.",
  },
  rate_limited: {
    title: "Amari is rate-limiting requests",
    icon: WifiOff,
    hint: "We'll serve the last good copy as soon as it's available.",
  },
  config: {
    title: "Leaderboard service isn't configured",
    icon: WifiOff,
    hint: "The deployment is missing its Amari API key.",
  },
  upstream: {
    title: "Amari isn't responding",
    icon: AlertTriangle,
    hint: "The upstream service returned an error. Try again in a moment.",
  },
  budget: {
    title: "Too many requests right now",
    icon: Clock3,
    hint: "We're protecting Amari's rate limit. Try again in a moment.",
  },
  timeout: {
    title: "Amari took too long",
    icon: Clock3,
    hint: "The request timed out. Try again.",
  },
  member_not_found: {
    title: "Player not found",
    icon: UserX,
    hint: "Check the Discord user ID and make sure the player has Amari EXP in this server.",
  },
};

export function ErrorState({
  code,
  message,
  period,
  onRetry,
  onAllTime,
}: ErrorStateProps) {
  const meta = errorMeta[code] ?? errorMeta.upstream;
  const Icon = meta.icon;

  return (
    <div className="arena-card mx-auto max-w-xl px-6 py-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-danger/20 bg-danger/10">
        <Icon className="h-5 w-5 text-danger" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-xl font-semibold">{meta.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {message}
      </p>
      {meta.hint ? (
        <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground/70">
          {meta.hint}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={onRetry} className="arena-button">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
        {period === "weekly" && code === "weekly_unavailable" ? (
          <button type="button" onClick={onAllTime} className="arena-button-secondary">
            View all-time
          </button>
        ) : (
          <Link href="/" className="arena-button-secondary">
            Look up another server
          </Link>
        )}
      </div>
    </div>
  );
}

export function EmptyLeaderboard({
  period,
  totalCount,
}: {
  period: LeaderboardPeriod;
  totalCount: number;
}) {
  return (
    <div className="arena-card px-6 py-12 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
        <SearchX className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold">
        {period === "weekly" ? "No weekly activity yet" : "No players recorded yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {period === "weekly"
          ? "Weekly leaderboards may be disabled for this server, or the current cycle hasn't started."
          : `Amari hasn't recorded anyone in this server yet. Once members chat and gain EXP, they'll appear here.`}
      </p>
      {totalCount === 0 ? (
        <Badge tone="muted" className="mt-4">
          0 players
        </Badge>
      ) : null}
    </div>
  );
}

export function NoSearchResults({
  query,
  loaded,
  totalCount,
  hasMore,
  allLoading,
  onClear,
  onSearchAll,
}: {
  query: string;
  loaded: number;
  totalCount: number;
  hasMore: boolean;
  allLoading: boolean;
  onClear: () => void;
  onSearchAll: () => void;
}) {
  return (
    <div className="arena-card px-6 py-10 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
        <SearchX className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-base font-semibold">No match for “{query}”</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {hasMore
          ? `We searched the ${formatNumber(loaded)} players loaded so far (of ${formatNumber(totalCount)}). Load the full list to search everyone.`
          : "Try a different spelling, or use Find me with your Discord user ID."}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={onClear} className="arena-button-secondary">
          Clear search
        </button>
        {hasMore ? (
          <button
            type="button"
            onClick={onSearchAll}
            disabled={allLoading}
            className="arena-button"
          >
            {allLoading ? "Loading all players…" : "Search all players"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function TruncatedNotice({ shown, total }: { shown: number; total: number }) {
  return (
    <p className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-xs text-muted-foreground">
      Showing the first {formatNumber(shown)} of {formatNumber(total)} players to
      protect the upstream API. Use Find me with a Discord user ID for an exact
      lookup.
    </p>
  );
}

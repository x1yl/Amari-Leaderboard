"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronDown,
  Info,
  Loader2,
  RefreshCw,
  Search,
  Share2,
  UserRoundSearch,
  X,
} from "lucide-react";

import { GuildIcon } from "@/components/guild-icon";
import { Logo } from "@/components/logo";
import { PlayerAvatar } from "@/components/player-avatar";
import { PlayerId } from "@/components/player-id";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { FindPlayerDialog } from "@/components/leaderboard/find-player-dialog";
import { LeaderboardSkeleton } from "@/components/leaderboard/leaderboard-skeleton";
import { PlayerRow } from "@/components/leaderboard/player-row";
import { Podium } from "@/components/leaderboard/podium";
import { ServerSwitcher } from "@/components/leaderboard/server-switcher";
import {
  EmptyLeaderboard,
  ErrorState,
  NoSearchResults,
  StaleBanner,
  TruncatedNotice,
} from "@/components/leaderboard/states";
import { addRecentServer } from "@/lib/recent-servers";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import { getLevelProgress } from "@/lib/levels";
import type {
  GuildInfo,
  LeaderboardPeriod,
  LeaderboardUser,
  MemberStats,
} from "@/lib/types";
import { isSnowflake } from "@/lib/validation";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 100;

export type SortKey = "rank" | "exp" | "level" | "name";

const SORT_LABELS: Record<SortKey, string> = {
  rank: "Official rank",
  exp: "EXP",
  level: "Level",
  name: "Name",
};

interface GuildResponse {
  guild: GuildInfo;
  period: LeaderboardPeriod;
  users: LeaderboardUser[];
  count: number;
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
  allLoaded?: boolean;
  truncated?: boolean;
  fetchedAt: number;
  stale: boolean;
  error?: { code?: string; message?: string };
}

interface MemberResponse {
  member?: MemberStats;
  error?: { message?: string };
}

class ApiError extends Error {
  code: string;

  constructor(message: string, code = "upstream") {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "AbortError"
  );
}

function scrollToPlayer(id: string) {
  window.setTimeout(() => {
    document.getElementById(`player-${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, 80);
}

export interface LeaderboardProps {
  guildID: string;
  initialPeriod?: LeaderboardPeriod;
  initialQuery?: string;
  initialSort?: SortKey;
  initialUser?: string;
}

export function Leaderboard({
  guildID,
  initialPeriod = "all",
  initialQuery = "",
  initialSort = "rank",
  initialUser = "",
}: LeaderboardProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [highlightId, setHighlightId] = useState(initialUser);

  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [guild, setGuild] = useState<GuildInfo | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [stale, setStale] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allLoading, setAllLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(
    null
  );
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [allError, setAllError] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);
  const [member, setMember] = useState<MemberStats | null>(null);

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const loadingAllRef = useRef(false);
  const memberLookupRef = useRef<string | null>(null);

  // Initial load and period changes.
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      setLoadMoreError(null);
      setAllError(null);
      setMemberError(null);
      setUsers([]);
      setGuild(null);
      setPage(1);
      setHasMore(false);
      setAllLoaded(false);
      setTruncated(false);
      setFetchedAt(null);
      setStale(false);

      try {
        const response = await fetch(
          `/api/guild/${guildID}?period=${period}&page=1&limit=${PAGE_SIZE}`,
          { signal: controller.signal }
        );
        const body = (await response.json().catch(() => null)) as
          | GuildResponse
          | null;

        if (!response.ok) {
          throw new ApiError(
            body?.error?.message ?? "We couldn't load this leaderboard.",
            body?.error?.code ?? "upstream"
          );
        }
        if (!body || cancelled) return;

        setGuild(body.guild ?? null);
        setUsers(body.users ?? []);
        setTotalCount(body.totalCount ?? 0);
        setPage(body.page ?? 1);
        setHasMore(Boolean(body.hasMore));
        setAllLoaded(Boolean(body.allLoaded) || !body.hasMore);
        setTruncated(Boolean(body.truncated));
        setFetchedAt(body.fetchedAt ?? null);
        setStale(Boolean(body.stale));

        if (body.guild) {
          addRecentServer({
            id: guildID,
            name: body.guild.name,
            iconUrl: body.guild.iconUrl,
          });
        }
      } catch (loadError) {
        if (cancelled || isAbortError(loadError)) return;
        setError(
          loadError instanceof ApiError
            ? { code: loadError.code, message: loadError.message }
            : {
                code: "upstream",
                message:
                  "We couldn't load this leaderboard. Check your connection and try again.",
              }
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [guildID, period, refreshToken]);

  // Keep the address bar shareable without triggering a server round-trip.
  useEffect(() => {
    const params = new URLSearchParams();
    if (period !== "all") params.set("period", period);
    if (query.trim()) params.set("q", query.trim());
    const urlSort = period === "weekly" && sort === "level" ? "rank" : sort;
    if (urlSort !== "rank") params.set("sort", urlSort);
    if (highlightId) params.set("user", highlightId);

    const qs = params.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    const current = `${window.location.pathname}${window.location.search}`;
    if (next !== current) {
      window.history.replaceState(null, "", next);
    }
  }, [period, query, sort, highlightId]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || isLoading || !hasMore || allLoaded) return;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const nextPage = page + 1;
      const response = await fetch(
        `/api/guild/${guildID}?period=${period}&page=${nextPage}&limit=${PAGE_SIZE}`
      );
      const body = (await response.json().catch(() => null)) as
        | GuildResponse
        | null;

      if (!response.ok) {
        throw new ApiError(
          body?.error?.message ?? "We couldn't load more players.",
          body?.error?.code ?? "upstream"
        );
      }
      if (!body) return;

      setUsers((previous) => {
        const seen = new Set(previous.map((user) => user.id));
        return [
          ...previous,
          ...(body.users ?? []).filter((user) => !seen.has(user.id)),
        ];
      });
      setPage(body.page ?? nextPage);
      setHasMore(Boolean(body.hasMore));
      setAllLoaded(Boolean(body.allLoaded) || !body.hasMore);
      setTotalCount(body.totalCount ?? totalCount);
      setGuild(body.guild ?? guild);
      setFetchedAt(body.fetchedAt ?? fetchedAt);
      setStale(Boolean(body.stale));
    } catch (loadError) {
      setLoadMoreError(
        loadError instanceof ApiError
          ? loadError.message
          : "We couldn't load more players. Try again."
      );
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [
    guildID,
    period,
    page,
    hasMore,
    allLoaded,
    isLoading,
    totalCount,
    guild,
    fetchedAt,
  ]);

  const loadAll = useCallback(async () => {
    if (loadingAllRef.current || allLoaded) return;
    loadingAllRef.current = true;
    setAllLoading(true);
    setAllError(null);

    try {
      const response = await fetch(
        `/api/guild/${guildID}?period=${period}&all=1`
      );
      const body = (await response.json().catch(() => null)) as
        | GuildResponse
        | null;

      if (!response.ok) {
        throw new ApiError(
          body?.error?.message ?? "We couldn't load the full leaderboard.",
          body?.error?.code ?? "upstream"
        );
      }
      if (!body) return;

      setUsers(body.users ?? []);
      setTotalCount(body.totalCount ?? 0);
      setPage(1);
      setHasMore(false);
      setAllLoaded(true);
      setTruncated(Boolean(body.truncated));
      setGuild(body.guild ?? guild);
      setFetchedAt(body.fetchedAt ?? fetchedAt);
      setStale(Boolean(body.stale));
    } catch (loadError) {
      setAllError(
        loadError instanceof ApiError
          ? loadError.message
          : "We couldn't load the full leaderboard. Try again."
      );
    } finally {
      loadingAllRef.current = false;
      setAllLoading(false);
    }
  }, [guildID, period, allLoaded, guild, fetchedAt]);

  // Real infinite scroll with a visible fallback button.
  useEffect(() => {
    if (!hasMore || isLoading || allLoaded || error || loadMoreError) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, allLoaded, error, loadMoreError, loadMore]);

  const lookupMember = useCallback(
    async (id: string): Promise<MemberStats | null> => {
      if (!isSnowflake(id)) {
        setMemberError("Enter the 17–20 digit Discord user ID.");
        return null;
      }

      setMemberLoading(true);
      setMemberError(null);
      try {
        const response = await fetch(`/api/guild/${guildID}/member/${id}`);
        const body = (await response.json().catch(() => null)) as
          | MemberResponse
          | null;
        if (!response.ok || !body?.member) {
          throw new ApiError(
            body?.error?.message ?? "We couldn't find that player.",
            "member_not_found"
          );
        }
        setMember(body.member);
        setHighlightId(body.member.id);
        return body.member;
      } catch (lookupError) {
        setMemberError(
          lookupError instanceof ApiError
            ? lookupError.message
            : "We couldn't find that player. Try again."
        );
        return null;
      } finally {
        setMemberLoading(false);
      }
    },
    [guildID]
  );

  // Deep links: ?user=<id>
  useEffect(() => {
    if (!initialUser || isLoading) return;
    if (memberLookupRef.current === initialUser) return;

    if (users.some((user) => user.id === initialUser)) {
      memberLookupRef.current = initialUser;
      setHighlightId(initialUser);
      return;
    }

    memberLookupRef.current = initialUser;
    void lookupMember(initialUser);
  }, [initialUser, isLoading, users, lookupMember]);

  useEffect(() => {
    if (!highlightId) return;
    if (!users.some((user) => user.id === highlightId)) return;
    scrollToPlayer(highlightId);
  }, [highlightId, users]);

  const effectiveSort: SortKey =
    period === "weekly" && sort === "level" ? "rank" : sort;

  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    users.forEach((user, index) => map.set(user.id, index + 1));
    return map;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();
    let list = users;

    if (search) {
      list = list.filter((user) =>
        user.username.toLowerCase().includes(search)
      );
    }

    if (effectiveSort === "exp") {
      list = [...list].sort(
        (a, b) => b.exp - a.exp || a.username.localeCompare(b.username)
      );
    } else if (effectiveSort === "level") {
      list = [...list].sort(
        (a, b) =>
          (b.level ?? 0) - (a.level ?? 0) ||
          b.exp - a.exp ||
          a.username.localeCompare(b.username)
      );
    } else if (effectiveSort === "name") {
      list = [...list].sort((a, b) => a.username.localeCompare(b.username));
    }

    return list;
  }, [users, query, effectiveSort]);

  const memberInList = member
    ? users.some((user) => user.id === member.id)
    : false;

  function changePeriod(next: LeaderboardPeriod) {
    if (next === period) return;
    setPeriod(next);
    setMember(null);
    setMemberError(null);
    memberLookupRef.current = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function share() {
    const url = window.location.href;
    const title = guild?.name
      ? `${guild.name} · Amari Leaderboard`
      : "Amari Leaderboard";

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title,
          text: "Check out this Amari leaderboard.",
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareMessage("Link copied");
    } catch (shareError) {
      if (isAbortError(shareError)) return;
      try {
        await navigator.clipboard.writeText(url);
        setShareMessage("Link copied");
      } catch {
        setShareMessage("Couldn't copy link");
      }
    }

    window.setTimeout(() => setShareMessage(null), 2200);
  }

  function showInList(id: string) {
    setHighlightId(id);
    setFindOpen(false);
    scrollToPlayer(id);
  }

  const showPodium =
    !isLoading &&
    !error &&
    !query.trim() &&
    effectiveSort === "rank" &&
    users.length > 0;

  const playerCountLabel = `${formatNumber(totalCount)} ${
    totalCount === 1 ? "player" : "players"
  }`;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Logo showTag={false} />
          <Link href="/" className="arena-button-ghost text-xs">
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            New search
          </Link>
        </div>

        {isLoading ? (
          <LeaderboardSkeleton />
        ) : error ? (
          <ErrorState
            code={error.code}
            message={error.message}
            period={period}
            onRetry={() => setRefreshToken((value) => value + 1)}
            onAllTime={() => changePeriod("all")}
          />
        ) : (
          <div className="animate-fade-up space-y-5">
            <LeaderboardHeader
              guild={guild}
              totalCount={totalCount}
              fetchedAt={fetchedAt}
              onSwitch={() => setSwitcherOpen(true)}
              onShare={() => void share()}
              shareMessage={shareMessage}
            />

            {stale ? (
              <StaleBanner
                fetchedAt={fetchedAt}
                onRefresh={() => setRefreshToken((value) => value + 1)}
              />
            ) : null}

            {guild && !guild.widgetEnabled && !guild.name ? (
              <p className="flex items-start gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                This server hides its Discord widget, so its name and icon
                aren&apos;t available. The leaderboard still works normally.
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="tablist"
                aria-label="Leaderboard period"
                className="inline-flex rounded-xl border border-white/[0.08] bg-white/[0.025] p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={period === "all"}
                  onClick={() => changePeriod("all")}
                  className={cn(
                    "rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors",
                    period === "all"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                  )}
                >
                  All time
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={period === "weekly"}
                  onClick={() => changePeriod("weekly")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors",
                    period === "weekly"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                  )}
                >
                  <CalendarDays className="h-3 w-3" aria-hidden="true" />
                  Weekly
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {period === "weekly"
                  ? "Current weekly cycle"
                  : "All-time rankings"}
              </p>
            </div>

            {period === "weekly" ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-100/85">
                <Info
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300"
                  aria-hidden="true"
                />
                <p>
                  <span className="font-semibold text-amber-200">
                    About weekly EXP:
                  </span>{" "}
                  these totals only represent a real weekly cycle when the
                  server has weekly resets enabled and announces a winner. If
                  the server never resets its weekly winner, this board keeps
                  accumulating and won&apos;t match a true one-week window.
                </p>
              </div>
            ) : users.some((user) => user.weeklyExp !== null) ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-100/85">
                <Info
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300"
                  aria-hidden="true"
                />
                <p>
                  <span className="font-semibold text-amber-200">
                    About weekly EXP:
                  </span>{" "}
                  these totals only represent a real weekly cycle when the
                  server has weekly resets enabled and announces a winner. If
                  the server never resets its weekly winner, this board keeps
                  accumulating and won&apos;t match a true one-week window.
                </p>
              </div>
            ) : null}

            {showPodium ? <Podium users={users} period={period} /> : null}

            {member && !memberInList ? (
              <ForeignPlayerCard
                member={member}
                loaded={users.length}
                totalCount={totalCount}
                allLoading={allLoading}
                onLoadAll={() => void loadAll()}
                onClose={() => setMember(null)}
              />
            ) : null}

            {memberError ? (
              <div className="flex items-start justify-between gap-3 rounded-xl border border-danger/20 bg-danger/[0.06] px-4 py-3 text-sm text-danger/90">
                <p className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {memberError}
                </p>
                <button
                  type="button"
                  onClick={() => setMemberError(null)}
                  className="rounded-md p-1 text-danger/70 transition-colors hover:bg-white/5 hover:text-danger"
                  aria-label="Dismiss player lookup error"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            <Toolbar
              query={query}
              onQueryChange={setQuery}
              sort={effectiveSort}
              onSortChange={setSort}
              period={period}
              loaded={users.length}
              matching={filteredUsers.length}
              totalCount={totalCount}
              allLoaded={allLoaded}
              hasMore={hasMore}
              allLoading={allLoading}
              onFindMe={() => setFindOpen(true)}
              onSearchAll={() => void loadAll()}
            />

            {allError ? (
              <div className="flex items-start justify-between gap-3 rounded-xl border border-danger/20 bg-danger/[0.06] px-4 py-3 text-sm text-danger/90">
                <p className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {allError}
                </p>
                <button
                  type="button"
                  onClick={() => void loadAll()}
                  className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold hover:bg-white/5"
                >
                  Retry
                </button>
              </div>
            ) : null}

            {allLoading ? (
              <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3 text-sm text-[#b9c0ff]">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Loading the full leaderboard…
              </div>
            ) : null}

            {memberLoading ? (
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Looking up that player…
              </div>
            ) : null}

            {truncated ? (
              <TruncatedNotice shown={users.length} total={totalCount} />
            ) : null}

            {filteredUsers.length > 0 ? (
              <ol className="space-y-2" aria-label="Players">
                {filteredUsers.map((user) => (
                  <PlayerRow
                    key={user.id}
                    user={user}
                    rank={rankMap.get(user.id) ?? 0}
                    period={period}
                    highlighted={highlightId === user.id}
                  />
                ))}
              </ol>
            ) : query.trim() ? (
              <NoSearchResults
                query={query.trim()}
                loaded={users.length}
                totalCount={totalCount}
                hasMore={hasMore && !allLoaded}
                allLoading={allLoading}
                onClear={() => setQuery("")}
                onSearchAll={() => void loadAll()}
              />
            ) : (
              <EmptyLeaderboard period={period} totalCount={totalCount} />
            )}

            {loadMoreError ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-danger/20 bg-danger/[0.06] px-4 py-4 text-sm text-danger/90 sm:flex-row sm:justify-between">
                <p>{loadMoreError}</p>
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  className="arena-button-secondary h-9 px-3 text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Retry
                </button>
              </div>
            ) : null}

            {hasMore && !allLoaded ? (
              <div ref={sentinelRef} className="flex justify-center py-5">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={isLoadingMore}
                  className="arena-button-secondary"
                >
                  {isLoadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isLoadingMore
                    ? "Loading players…"
                    : `Load more players (${formatNumber(
                        Math.max(0, totalCount - users.length)
                      )} left)`}
                </button>
              </div>
            ) : filteredUsers.length > 0 && !allLoading ? (
              <p className="py-7 text-center text-xs text-muted-foreground">
                End of leaderboard · {playerCountLabel}
              </p>
            ) : null}
          </div>
        )}
      </div>

      <SiteFooter />

      <ServerSwitcher open={switcherOpen} onOpenChange={setSwitcherOpen} />
      <FindPlayerDialog
        open={findOpen}
        onOpenChange={setFindOpen}
        guildId={guildID}
        users={users}
        totalCount={totalCount}
        onShowInList={showInList}
      />
    </div>
  );
}

function LeaderboardHeader({
  guild,
  totalCount,
  fetchedAt,
  onSwitch,
  onShare,
  shareMessage,
}: {
  guild: GuildInfo | null;
  totalCount: number;
  fetchedAt: number | null;
  onSwitch: () => void;
  onShare: () => void;
  shareMessage: string | null;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <GuildIcon
          name={guild?.name ?? null}
          iconUrl={guild?.iconUrl ?? null}
          size="lg"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1
              className="truncate text-xl font-bold tracking-tight sm:text-2xl"
              title={guild?.name ?? "Discord server"}
            >
              {guild?.name ?? "Discord server"}
            </h1>
            <Badge tone="muted" className="hidden shrink-0 sm:inline-flex">
              Unofficial
            </Badge>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
            <span>{formatNumber(totalCount)} players</span>
            {guild?.onlineCount !== null && guild?.onlineCount !== undefined ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{formatNumber(guild.onlineCount)} online now</span>
              </>
            ) : null}
            {fetchedAt ? (
              <>
                <span aria-hidden="true">·</span>
                <span>updated {formatRelativeTime(fetchedAt)}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onShare}
          className="arena-button-secondary h-10 px-3 text-xs"
          aria-label="Share this leaderboard"
        >
          {shareMessage === "Link copied" ? (
            <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
          ) : (
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">
            {shareMessage ?? "Share"}
          </span>
        </button>
        <button
          type="button"
          onClick={onSwitch}
          className="arena-button-secondary h-10 px-3 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Switch server
        </button>
      </div>
    </header>
  );
}

function Toolbar({
  query,
  onQueryChange,
  sort,
  onSortChange,
  period,
  loaded,
  matching,
  totalCount,
  allLoaded,
  hasMore,
  allLoading,
  onFindMe,
  onSearchAll,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  period: LeaderboardPeriod;
  loaded: number;
  matching: number;
  totalCount: number;
  allLoaded: boolean;
  hasMore: boolean;
  allLoading: boolean;
  onFindMe: () => void;
  onSearchAll: () => void;
}) {
  const hasQuery = Boolean(query.trim());

  return (
    <section className="space-y-2" aria-label="Search and sort players">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search players by name"
            aria-label="Search players by name"
            className="arena-input pl-10 pr-10"
            autoComplete="off"
            spellCheck={false}
          />
          {hasQuery ? (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="absolute right-2 top-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <label htmlFor="leaderboard-sort" className="sr-only">
              Sort players
            </label>
            <select
              id="leaderboard-sort"
              value={sort}
              onChange={(event) => onSortChange(event.target.value as SortKey)}
              className="arena-input h-12 appearance-none pl-3 pr-9 text-xs font-semibold"
            >
              {(Object.keys(SORT_LABELS) as SortKey[])
                .filter((key) => period === "all" || key !== "level")
                .map((key) => (
                  <option key={key} value={key} className="bg-[#11141d]">
                    {SORT_LABELS[key]}
                  </option>
                ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
          </div>

          <button
            type="button"
            onClick={onFindMe}
            className="arena-button-secondary h-12 shrink-0 px-3 text-xs"
          >
            <UserRoundSearch className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Find me</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p aria-live="polite">
          {hasQuery
            ? `${formatNumber(matching)} match${
                matching === 1 ? "" : "es"
              } in ${formatNumber(loaded)} loaded`
            : allLoaded
              ? `Showing all ${formatNumber(totalCount)} players`
              : `Showing ${formatNumber(loaded)} of ${formatNumber(
                  totalCount
                )} players`}
        </p>
        {hasQuery && !allLoaded && hasMore ? (
          <button
            type="button"
            onClick={onSearchAll}
            disabled={allLoading}
            className="font-semibold text-[#b9c0ff] transition-colors hover:text-white"
          >
            Search all {formatNumber(totalCount)} players →
          </button>
        ) : null}
        {!hasQuery && !allLoaded && hasMore ? (
          <button
            type="button"
            onClick={onSearchAll}
            disabled={allLoading}
            className="font-semibold text-[#b9c0ff] transition-colors hover:text-white disabled:opacity-50"
          >
            {allLoading
              ? "Loading all players…"
              : `Load all ${formatNumber(totalCount)} players →`}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function ForeignPlayerCard({
  member,
  loaded,
  totalCount,
  allLoading,
  onLoadAll,
  onClose,
}: {
  member: MemberStats;
  loaded: number;
  totalCount: number;
  allLoading: boolean;
  onLoadAll: () => void;
  onClose: () => void;
}) {
  const progress = getLevelProgress(member.exp, member.level);

  return (
    <div className="relative rounded-2xl border border-primary/20 bg-primary/[0.055] p-4 pr-10">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        aria-label="Dismiss player card"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex flex-wrap items-center gap-3">
        <PlayerAvatar id={member.id} username={member.username} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{member.username}</p>
          <PlayerId id={member.id} showLabel className="mt-0.5" />
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge tone="primary">Level {member.level}</Badge>
            <span className="num">{formatNumber(member.exp)} all-time EXP</span>
            <span className="num text-[#b9c0ff]">
              {formatNumber(member.weeklyExp)} weekly
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onLoadAll}
          disabled={allLoading}
          className="arena-button-secondary h-9 px-3 text-xs"
        >
          {allLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Load all to find rank
        </button>
      </div>
      <div className="mt-3 max-w-md">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-[#9d7bff]"
            style={{ width: `${Math.max(2, progress.percent)}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          {formatNumber(progress.remaining)} EXP to level {member.level + 1} ·
          outside the {formatNumber(loaded)} rows loaded so far
          {totalCount > loaded ? ` of ${formatNumber(totalCount)}` : ""}
        </p>
      </div>
    </div>
  );
}

import { Crown } from "lucide-react";

import { PlayerAvatar } from "@/components/player-avatar";
import { PlayerId } from "@/components/player-id";
import { RankBadge } from "@/components/rank-badge";
import { formatNumber } from "@/lib/format";
import { getLevelProgress } from "@/lib/levels";
import type { LeaderboardPeriod, LeaderboardUser } from "@/lib/types";
import { cn } from "@/lib/utils";

function PodiumCard({
  user,
  rank,
  period,
  featured,
}: {
  user: LeaderboardUser;
  rank: number;
  period: LeaderboardPeriod;
  featured: boolean;
}) {
  const progress =
    period === "all" && user.level !== null
      ? getLevelProgress(user.exp, user.level)
      : null;

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center rounded-2xl border p-5 text-center transition-transform duration-200 hover:-translate-y-0.5",
        featured
          ? "border-gold/30 bg-gradient-to-b from-gold/[0.09] to-white/[0.02] shadow-[0_0_50px_-24px_hsl(var(--gold)/0.6)] sm:py-7"
          : "border-white/[0.08] bg-white/[0.025] sm:mt-5",
        rank === 1 ? "sm:order-2" : rank === 2 ? "sm:order-1" : "sm:order-3"
      )}
    >
      {featured ? (
        <Crown
          className="absolute -top-3.5 left-1/2 h-7 w-7 -translate-x-1/2 text-gold drop-shadow-[0_0_10px_hsl(var(--gold)/0.5)]"
          aria-hidden="true"
        />
      ) : null}

      <RankBadge rank={rank} className="mb-4" />
      <PlayerAvatar
        id={user.id}
        username={user.username}
        size={featured ? "xl" : "lg"}
        className={cn(
          featured ? "ring-2 ring-gold/40" : "ring-1 ring-white/10"
        )}
      />
      <p
        className="mt-4 w-full truncate text-sm font-semibold text-foreground sm:text-base"
        title={user.username}
      >
        {user.username}
      </p>
      <PlayerId id={user.id} showLabel className="mt-1" />
      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
        {period === "all" && user.level !== null ? (
          <>
            <span>Level {user.level}</span>
            <span aria-hidden="true">·</span>
          </>
        ) : null}
        <span className="num font-semibold text-foreground/90">
          {formatNumber(user.exp)}
        </span>
        <span>{period === "weekly" ? "weekly EXP" : "EXP"}</span>
      </div>

      {progress ? (
        <div className="mt-4 w-full max-w-[190px]">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-[#9d7bff]"
              style={{ width: `${Math.max(3, progress.percent)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground/80">
            {formatNumber(progress.remaining)} EXP to level {user.level! + 1}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function Podium({
  users,
  period,
}: {
  users: LeaderboardUser[];
  period: LeaderboardPeriod;
}) {
  const top = users.slice(0, 3);
  if (top.length === 0) return null;

  return (
    <section aria-label="Top three players">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="label-caps">Podium</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            {period === "weekly" ? "This cycle's front-runners" : "The top of the board"}
          </h2>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3 sm:items-end">
        {top.map((user, index) => (
          <div
            key={user.id}
            className={cn(
              "w-full sm:w-[calc(33.333%-0.5rem)]",
              top.length === 2 && "sm:w-[calc(50%-0.375rem)]",
              top.length === 1 && "sm:w-[min(100%,320px)]"
            )}
          >
            <PodiumCard
              user={user}
              rank={index + 1}
              period={period}
              featured={index === 0}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

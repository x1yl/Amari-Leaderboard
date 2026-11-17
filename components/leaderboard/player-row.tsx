import { UserRoundCheck } from "lucide-react";

import { PlayerAvatar } from "@/components/player-avatar";
import { PlayerId } from "@/components/player-id";
import { RankBadge } from "@/components/rank-badge";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";
import { getLevelProgress } from "@/lib/levels";
import type { LeaderboardPeriod, LeaderboardUser } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PlayerRowProps {
  user: LeaderboardUser;
  rank: number;
  period: LeaderboardPeriod;
  highlighted?: boolean;
}

export function PlayerRow({
  user,
  rank,
  period,
  highlighted = false,
}: PlayerRowProps) {
  const progress =
    period === "all" && user.level !== null
      ? getLevelProgress(user.exp, user.level)
      : null;

  return (
    <li
      id={`player-${user.id}`}
      className={cn(
        "group flex scroll-mt-28 items-center gap-3 rounded-xl border border-white/[0.055] bg-white/[0.025] p-3 transition-colors hover:border-white/10 hover:bg-white/[0.04]",
        highlighted && "border-primary/40 bg-primary/[0.07] ring-1 ring-primary/25"
      )}
      style={{ contentVisibility: "auto", containIntrinsicSize: "72px" }}
    >
      <RankBadge rank={rank} />

      <PlayerAvatar id={user.id} username={user.username} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="truncate text-sm font-semibold text-foreground sm:text-[15px]"
            title={user.username}
          >
            {user.username}
          </span>
          {highlighted ? (
            <Badge tone="primary" className="shrink-0 px-1.5 py-0.5 text-[9px]">
              <UserRoundCheck className="h-2.5 w-2.5" aria-hidden="true" />
              You
            </Badge>
          ) : null}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
          {period === "all" && user.level !== null ? (
            <span className="rounded-md border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-semibold text-foreground/80">
              Level {user.level}
            </span>
          ) : (
            <span className="rounded-md border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-semibold text-foreground/80">
              Weekly
            </span>
          )}
          <span className="num text-[11px] sm:hidden">
            {formatNumber(user.exp)} {period === "weekly" ? "weekly EXP" : "EXP"}
          </span>
          {period === "all" && user.weeklyExp !== null ? (
            <span className="hidden text-[11px] sm:inline">
              {formatNumber(user.weeklyExp)} weekly
            </span>
          ) : null}
          <PlayerId id={user.id} showLabel className="text-[10px]" />
        </div>

        {progress ? (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 w-full max-w-[240px] overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-[#9d7bff]"
                style={{ width: `${Math.max(2, progress.percent)}%` }}
              />
            </div>
            <span className="hidden text-[10px] text-muted-foreground/70 sm:inline">
              {formatNumber(progress.remaining)} to next
            </span>
          </div>
        ) : null}
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="label-caps text-[9px]">
          {period === "weekly" ? "Weekly EXP" : "EXP"}
        </p>
        <p className="num mt-1 text-sm font-semibold text-foreground">
          {formatNumber(user.exp)}
        </p>
      </div>
    </li>
  );
}

import { Crown, Medal } from "lucide-react";

import { cn } from "@/lib/utils";

const podium = {
  1: {
    label: "1st",
    className: "border-gold/40 bg-gold/15 text-gold",
    icon: Crown,
  },
  2: {
    label: "2nd",
    className: "border-silver/30 bg-silver/10 text-silver",
    icon: Medal,
  },
  3: {
    label: "3rd",
    className: "border-bronze/35 bg-bronze/10 text-bronze",
    icon: Medal,
  },
} as const;

export function RankBadge({
  rank,
  className,
}: {
  rank: number;
  className?: string;
}) {
  const medal = podium[rank as 1 | 2 | 3];

  if (medal) {
    const Icon = medal.icon;
    return (
      <span
        className={cn(
          "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg border px-2 text-xs font-bold",
          medal.className,
          className
        )}
        aria-label={`Rank ${rank}`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {rank}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 text-xs font-semibold text-muted-foreground",
        className
      )}
      aria-label={`Rank ${rank}`}
    >
      {rank}
    </span>
  );
}

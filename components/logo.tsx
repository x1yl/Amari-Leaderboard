import Link from "next/link";
import { BarChart3 } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({
  className,
  showTag = true,
}: {
  className?: string;
  showTag?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-none",
        className
      )}
      aria-label="Amari Leaderboard home"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-gradient-to-br from-primary/30 to-primary/5 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.8)] transition-transform group-hover:scale-105">
        <BarChart3 className="h-[18px] w-[18px] text-[#b9c0ff]" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-sm font-bold tracking-tight text-foreground">
          Amari <span className="text-muted-foreground">Leaderboard</span>
        </span>
        {showTag ? (
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
            Unofficial viewer
          </span>
        ) : null}
      </span>
    </Link>
  );
}

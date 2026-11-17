import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "default" | "primary" | "gold" | "muted" | "success" | "danger";

const tones: Record<BadgeTone, string> = {
  default: "border-white/10 bg-white/[0.05] text-foreground",
  primary: "border-primary/30 bg-primary/15 text-[#b8bfff]",
  gold: "border-gold/30 bg-gold/10 text-gold",
  muted: "border-white/10 bg-white/[0.03] text-muted-foreground",
  success: "border-success/30 bg-success/10 text-success",
  danger: "border-danger/30 bg-danger/10 text-danger",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

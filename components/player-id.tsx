"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

export function PlayerId({
  id,
  showLabel = false,
  className,
}: {
  id: string;
  showLabel?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1_500);
    } catch {
      // Clipboard access can fail (permissions or an insecure context).
      // The ID stays visible and selectable either way.
    }
  }

  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground/70",
        className
      )}
    >
      {showLabel ? (
        <span className="shrink-0 uppercase tracking-wide text-muted-foreground/50">
          ID
        </span>
      ) : null}
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy Discord user ID ${id}`}
        className="num inline-flex min-w-0 items-center gap-1 rounded px-0.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
      >
        <span className="truncate">{id}</span>
        {copied ? (
          <Check
            className="h-2.5 w-2.5 shrink-0 text-emerald-400"
            aria-hidden="true"
          />
        ) : (
          <Copy
            className="h-2.5 w-2.5 shrink-0 opacity-50"
            aria-hidden="true"
          />
        )}
      </button>
      {copied ? (
        <span className="font-medium text-emerald-400">Copied</span>
      ) : null}
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied Discord user ID" : ""}
      </span>
    </span>
  );
}

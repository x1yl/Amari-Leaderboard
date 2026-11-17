"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  ClipboardPaste,
  History,
  Loader2,
  Search,
} from "lucide-react";

import { GuildIcon } from "@/components/guild-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRecentServers } from "@/hooks/useRecentServers";
import { parseServerInput } from "@/lib/validation";

interface ResolveResponse {
  guildId: string;
  guild?: { name?: string | null; iconUrl?: string | null };
  error?: { message?: string };
}

export function ServerSwitcher({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { servers, remove } = useRecentServers();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function goToServer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = parseServerInput(input);
    if (!parsed) {
      setError("Enter a Discord server ID or an invite link.");
      return;
    }

    if (parsed.type === "id") {
      onOpenChange(false);
      setInput("");
      router.push(`/leaderboard/${parsed.guildId}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/resolve?input=${encodeURIComponent(input.trim())}`
      );
      const body = (await response.json()) as ResolveResponse;
      if (!response.ok || !body.guildId) {
        throw new Error(
          body.error?.message ?? "We couldn't resolve that invite link."
        );
      }
      onOpenChange(false);
      setInput("");
      router.push(`/leaderboard/${body.guildId}`);
    } catch (resolveError) {
      setError(
        resolveError instanceof Error
          ? resolveError.message
          : "We couldn't resolve that invite link."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setInput(text.trim());
        setError(null);
      }
    } catch {
      setError("Clipboard access was blocked. Paste manually instead.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Switch server</DialogTitle>
          <DialogDescription>
            Open another Amari leaderboard with a server ID or invite link.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={goToServer} className="space-y-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Server ID or discord.gg invite"
              aria-label="Discord server ID or invite link"
              className="arena-input pl-10 pr-20"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={paste}
              className="absolute right-2 top-1/2 inline-flex h-8 -translate-y-1/2 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
              Paste
            </button>
          </div>

          {error ? (
            <p className="flex items-start gap-1.5 text-xs text-danger" role="alert">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !input.trim()}
            className="arena-button w-full"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            )}
            Open leaderboard
          </button>
        </form>

        {servers.length > 0 ? (
          <div>
            <p className="label-caps mb-2 flex items-center gap-1.5">
              <History className="h-3 w-3" aria-hidden="true" />
              Recently viewed
            </p>
            <div className="space-y-1">
              {servers.map((server) => (
                <div
                  key={server.id}
                  className="group flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] p-1.5 transition-colors hover:bg-white/[0.05]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      setInput("");
                      router.push(`/leaderboard/${server.id}`);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 py-1 text-left"
                  >
                    <GuildIcon
                      name={server.name}
                      iconUrl={server.iconUrl}
                      size="sm"
                      className="h-8 w-8 rounded-lg text-xs"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {server.name ?? "Discord server"}
                      </span>
                      <span className="block truncate text-[10px] text-muted-foreground">
                        {server.id}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(server.id)}
                    className="mr-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground/50 opacity-0 transition-all hover:bg-white/10 hover:text-foreground group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Remove ${server.name ?? server.id}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

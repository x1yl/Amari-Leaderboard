"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardPaste,
  Link2,
  Loader2,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trophy,
  UserRoundSearch,
  Zap,
} from "lucide-react";

import { GuildIcon } from "@/components/guild-icon";
import { PlayerAvatar } from "@/components/player-avatar";
import { RankBadge } from "@/components/rank-badge";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { useRecentServers } from "@/hooks/useRecentServers";
import { formatNumber } from "@/lib/format";
import type { GuildInfo } from "@/lib/types";
import { parseServerInput } from "@/lib/validation";

interface ResolveResponse {
  guildId: string;
  guild: GuildInfo;
  error?: { message?: string };
}

function serverLabel(id: string, name: string | null): string {
  if (name) return name;
  return `Server …${id.slice(-4)}`;
}

export function HomeView() {
  const router = useRouter();
  const { servers: recentServers, remove, clear } = useRecentServers();

  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pasteMessage, setPasteMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPasteMessage(null);

    const parsed = parseServerInput(input);
    if (!parsed) {
      setError(
        "Enter a Discord server ID (17–20 digits) or an invite link like discord.gg/abc123."
      );
      return;
    }

    if (parsed.type === "id") {
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
          body.error?.message ??
            "We couldn't resolve that invite link. Try the server ID instead."
        );
      }
      router.push(`/leaderboard/${body.guildId}`);
    } catch (resolveError) {
      setError(
        resolveError instanceof Error
          ? resolveError.message
          : "We couldn't resolve that invite link. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function pasteFromClipboard() {
    setError(null);
    setPasteMessage(null);
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setPasteMessage("Your clipboard is empty.");
        return;
      }
      setInput(text.trim());
      setPasteMessage("Pasted from clipboard.");
    } catch {
      setPasteMessage("Clipboard access was blocked. Paste manually instead.");
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-10 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="hero-glow animate-fade-up">
            <Badge tone="primary" className="mb-5">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Unofficial Amari viewer
            </Badge>
            <h1 className="max-w-xl text-balance text-5xl font-bold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              See who&apos;s <span className="gradient-text">winning.</span>
            </h1>
            <p className="mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
              Open any Discord server&apos;s Amari leaderboard in seconds. Check
              all-time rankings, catch the weekly race, and share the score with
              your community.
            </p>

            <div id="lookup" className="mt-8 max-w-xl scroll-mt-28">
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-2 shadow-card backdrop-blur-sm"
                noValidate
              >
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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
                      aria-describedby={error ? "lookup-error" : "lookup-help"}
                      className="arena-input border-transparent bg-transparent pl-11 pr-24 focus-visible:border-primary/40"
                      autoComplete="off"
                      spellCheck={false}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={pasteFromClipboard}
                      className="absolute right-2 top-1/2 inline-flex h-8 -translate-y-1/2 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                    >
                      <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
                      Paste
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="arena-button shrink-0 px-5"
                    disabled={isSubmitting || !input.trim()}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    )}
                    View leaderboard
                  </button>
                </div>
              </form>

              <div className="mt-3 flex min-h-5 items-start gap-2 text-xs">
                {error ? (
                  <p
                    id="lookup-error"
                    role="alert"
                    className="flex items-start gap-1.5 text-danger"
                  >
                    <AlertCircle
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    {error}
                  </p>
                ) : (
                  <p id="lookup-help" className="text-muted-foreground/80">
                    Tip: paste a server ID or an invite link. No login required.
                  </p>
                )}
              </div>
              {pasteMessage ? (
                <p className="mt-1 text-xs text-muted-foreground" role="status">
                  {pasteMessage}
                </p>
              ) : null}

              {recentServers.length > 0 ? (
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="label-caps">Recently viewed</p>
                    <button
                      type="button"
                      onClick={clear}
                      className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentServers.map((server) => (
                      <div
                        key={server.id}
                        className="group inline-flex max-w-full items-center gap-1 rounded-xl border border-white/10 bg-white/[0.035] p-1 pr-1.5 transition-colors hover:border-white/20"
                      >
                        <Link
                          href={`/leaderboard/${server.id}`}
                          className="inline-flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1"
                        >
                          <GuildIcon
                            name={server.name}
                            iconUrl={server.iconUrl}
                            size="sm"
                            className="h-6 w-6 rounded-md text-[10px]"
                          />
                          <span className="max-w-[170px] truncate text-xs font-medium text-foreground/90">
                            {serverLabel(server.id, server.name)}
                          </span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(server.id)}
                          aria-label={`Remove ${serverLabel(server.id, server.name)}`}
                          className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground/60 opacity-0 transition-all hover:bg-white/10 hover:text-foreground group-hover:opacity-100 focus:opacity-100"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                No account needed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                All-time + weekly
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                Shareable links
              </span>
            </div>
          </div>

          <div className="relative animate-fade-up lg:justify-self-end" style={{ animationDelay: "90ms" }}>
            <div className="absolute -inset-6 rounded-[2rem] bg-primary/10 blur-3xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0f131d]/90 p-4 shadow-glow backdrop-blur-md sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/30 bg-gold/10">
                    <Trophy className="h-4 w-4 text-gold" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Weekly podium
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Illustrative preview
                    </p>
                  </div>
                </div>
                <Badge tone="muted">Sample</Badge>
              </div>

              <div className="space-y-2">
                {[
                  { rank: 1, name: "Nova", level: 84, exp: 412_905 },
                  { rank: 2, name: "Kai", level: 79, exp: 365_220 },
                  { rank: 3, name: "Rhea", level: 71, exp: 298_140 },
                ].map((player) => (
                  <div
                    key={player.rank}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5"
                  >
                    <RankBadge rank={player.rank} />
                    <PlayerAvatar
                      id={`preview-${player.name}`}
                      username={player.name}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {player.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Level {player.level}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="num text-xs font-semibold text-foreground/90">
                        {formatNumber(player.exp)}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        EXP
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/15 bg-primary/[0.08] px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-[#b9c0ff]" aria-hidden="true" />
                  <p className="text-xs font-medium text-foreground/90">
                    Level progress, weekly reset, and exact ranks
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-label="Product highlights"
          className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"
        >
          <div className="grid gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3 sm:grid-cols-3 sm:p-4">
            {[
              {
                icon: CalendarDays,
                title: "All-time + weekly",
                copy: "Two views, one clean scoreboard.",
              },
              {
                icon: UserRoundSearch,
                title: "Find your rank",
                copy: "Search by name or exact Discord ID.",
              },
              {
                icon: Link2,
                title: "Share the race",
                copy: "Send a permanent link to your server.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.03]"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                  <item.icon className="h-4 w-4 text-[#b9c0ff]" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {item.copy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="max-w-2xl">
            <p className="label-caps">How it works</p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              From server to scoreboard in three steps.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Amari already tracks the levels. This site just makes the numbers
              easy to read and share.
            </p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Copy your server ID",
                copy: "Or use an invite link. Discord server IDs are 17–20 digits.",
                icon: ClipboardPaste,
              },
              {
                step: "02",
                title: "Open the leaderboard",
                copy: "We pull the latest Amari rankings and cache them to stay fast.",
                icon: Search,
              },
              {
                step: "03",
                title: "Find your spot",
                copy: "Search the list, jump to your Discord user ID, and share the link.",
                icon: Trophy,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="arena-card group relative overflow-hidden p-6 transition-colors hover:border-white/12"
              >
                <span className="absolute right-5 top-4 text-4xl font-black tracking-tighter text-white/[0.045]">
                  {item.step}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                  <item.icon className="h-[18px] w-[18px] text-[#b9c0ff]" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 rounded-3xl border border-white/[0.07] bg-gradient-to-br from-white/[0.045] to-white/[0.015] p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="label-caps">Built for checking in</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
                A scoreboard that respects your time.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                No giant dashboard, no login wall, no noise. Just the rankings,
                the weekly race, and the details that make a leveling community
                fun.
              </p>
              <Link href="#lookup" className="arena-button mt-7">
                Open a leaderboard
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: CalendarDays,
                  title: "Weekly race",
                  copy: "See the current weekly cycle when the server has it enabled.",
                },
                {
                  icon: Zap,
                  title: "Level progress",
                  copy: "EXP-to-next-level calculated from Amari's level table.",
                },
                {
                  icon: Smartphone,
                  title: "Mobile-first rows",
                  copy: "Avatar, rank, level, and EXP stay visible on every screen.",
                },
                {
                  icon: ShieldCheck,
                  title: "Honest data",
                  copy: "Stable local avatars and clear freshness labels.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-white/[0.07] bg-[#0d1018]/60 p-4"
                >
                  <feature.icon className="h-[18px] w-[18px] text-[#b9c0ff]" aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {feature.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="faq"
          className="mx-auto w-full max-w-3xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="text-center">
            <p className="label-caps">FAQ</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              Questions, answered.
            </h2>
          </div>

          <div className="mt-8 divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
            {[
              {
                question: "Is this an official Amari site?",
                answer:
                  "No. This is an unofficial fan project. It uses Amari's public API and is not affiliated with or endorsed by Amari.",
              },
              {
                question: "Why can't I see the server's name or icon?",
                answer:
                  "Discord only exposes a server's name and icon through its widget or invite data. If the server hides its widget and has no usable invite, the leaderboard still works but the identity falls back to a neutral label.",
              },
              {
                question: "Why are avatars not real Discord photos?",
                answer:
                  "Amari's leaderboard API returns usernames, levels, and EXP, but not avatar hashes. We generate a stable local avatar from the Discord user ID instead of sending IDs to a third-party avatar service.",
              },
              {
                question: "How fresh is the data?",
                answer:
                  "Leaderboards are cached briefly to respect Amari's API rate limits. Each page shows when its data was fetched. During rate limiting, we keep serving the last good copy.",
              },
              {
                question: "Why is the weekly tab empty?",
                answer:
                  "Weekly leaderboards have to be enabled by the server admin and reset when the server announces its winners. If a server doesn't use them, there may be no weekly data to show.",
              },
              {
                question: "How do I find my exact rank?",
                answer:
                  "Search the loaded list by username, or use Find me with your Discord user ID. Usernames are not unique, so the user ID is the reliable option.",
              },
            ].map((item) => (
              <details key={item.question} className="group px-5 py-4 sm:px-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-foreground marker:hidden">
                  {item.question}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

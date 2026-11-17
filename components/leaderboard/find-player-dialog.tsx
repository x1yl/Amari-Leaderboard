"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Search, UserRoundSearch } from "lucide-react";

import { PlayerAvatar } from "@/components/player-avatar";
import { PlayerId } from "@/components/player-id";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";
import { getLevelProgress } from "@/lib/levels";
import type { LeaderboardUser, MemberStats } from "@/lib/types";
import { isSnowflake } from "@/lib/validation";

interface MemberResponse {
  member?: MemberStats;
  error?: { message?: string };
}

export function FindPlayerDialog({
  open,
  onOpenChange,
  guildId,
  users,
  totalCount,
  onShowInList,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guildId: string;
  users: LeaderboardUser[];
  totalCount: number;
  onShowInList: (id: string) => void;
}) {
  const [userId, setUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [member, setMember] = useState<MemberStats | null>(null);

  async function lookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMember(null);

    if (!isSnowflake(userId.trim())) {
      setError("Enter the 17–20 digit Discord user ID.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/guild/${guildId}/member/${userId.trim()}`
      );
      const body = (await response.json()) as MemberResponse;
      if (!response.ok || !body.member) {
        throw new Error(
          body.error?.message ?? "We couldn't find that player in this server."
        );
      }
      setMember(body.member);
    } catch (lookupError) {
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "We couldn't find that player in this server."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const inLoadedList = member
    ? users.some((user) => user.id === member.id)
    : false;
  const progress = member
    ? getLevelProgress(member.exp, member.level)
    : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setError(null);
          setMember(null);
          setUserId("");
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRoundSearch className="h-4 w-4 text-[#b9c0ff]" aria-hidden="true" />
            Find a player
          </DialogTitle>
          <DialogDescription>
            Usernames aren&apos;t unique, so use a Discord user ID for an exact
            match. We&apos;ll show their stats and jump to them if they&apos;re
            loaded.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={lookup} className="space-y-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={userId}
              onChange={(event) => {
                setUserId(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Discord user ID"
              aria-label="Discord user ID"
              inputMode="numeric"
              className="arena-input num pl-10"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              disabled={isLoading}
            />
          </div>
          {error ? (
            <p className="flex items-start gap-1.5 text-xs text-danger" role="alert">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isLoading || !userId.trim()}
            className="arena-button w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
            Look up player
          </button>
        </form>

        <details className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
          <summary className="cursor-pointer list-none text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            How do I copy my Discord user ID?
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground/80">
            Enable Settings → Advanced → Developer Mode, then right-click your
            profile and choose “Copy User ID.”
          </p>
        </details>

        {member ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.05] p-4">
            <div className="flex items-center gap-3">
              <PlayerAvatar id={member.id} username={member.username} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{member.username}</p>
                <PlayerId id={member.id} showLabel className="mt-0.5" />
              </div>
              <Badge tone="primary">Level {member.level}</Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.06] bg-black/15 p-3">
                <p className="label-caps text-[9px]">All-time EXP</p>
                <p className="num mt-1 text-lg font-semibold">
                  {formatNumber(member.exp)}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-black/15 p-3">
                <p className="label-caps text-[9px]">Weekly EXP</p>
                <p className="num mt-1 text-lg font-semibold text-[#b9c0ff]">
                  {formatNumber(member.weeklyExp)}
                </p>
              </div>
            </div>

            {progress ? (
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-[#9d7bff]"
                    style={{ width: `${Math.max(2, progress.percent)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  {formatNumber(progress.remaining)} EXP to level {member.level + 1}
                </p>
              </div>
            ) : null}

            {inLoadedList ? (
              <button
                type="button"
                onClick={() => {
                  onShowInList(member.id);
                  onOpenChange(false);
                }}
                className="arena-button mt-4 w-full"
              >
                Show in leaderboard
              </button>
            ) : (
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                This player isn&apos;t in the {formatNumber(users.length)} rows loaded
                so far (of {formatNumber(totalCount)}). Use “Search all players”
                in the toolbar to load the complete list and find their rank.
              </p>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

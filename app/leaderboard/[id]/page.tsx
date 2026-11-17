import type { Metadata } from "next";

import { Leaderboard, type SortKey } from "@/components/leaderboard/leaderboard";
import { getGuildInfo } from "@/lib/discord";
import { isSnowflake } from "@/lib/validation";

interface LeaderboardPageProps {
  params: { id: string };
  searchParams: {
    period?: string;
    q?: string;
    sort?: string;
    user?: string;
  };
}

const sortKeys: SortKey[] = ["rank", "exp", "level", "name"];

export async function generateMetadata({
  params,
}: LeaderboardPageProps): Promise<Metadata> {
  const id = params.id;
  if (!isSnowflake(id)) {
    return {
      title: "Server Leaderboard",
      description:
        "View all-time and weekly Amari leaderboards for any Discord server.",
      robots: { index: false, follow: false },
    };
  }

  const info = await getGuildInfo(id).catch(() => null);
  const title = info?.name
    ? `${info.name} Leaderboard`
    : "Discord Server Leaderboard";
  const description = info?.name
    ? `See the all-time and weekly Amari rankings for ${info.name}. Find your rank, compare EXP, and share the leaderboard.`
    : "View all-time and weekly Amari leaderboards for this Discord server. Find your rank, compare EXP, and share the leaderboard.";

  return {
    title,
    description,
    alternates: { canonical: `/leaderboard/${id}` },
    openGraph: {
      title,
      description,
      url: `/leaderboard/${id}`,
      siteName: "Amari Leaderboard",
      type: "website",
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
    },
  };
}

export default function LeaderboardPage({
  params,
  searchParams,
}: LeaderboardPageProps) {
  const period = searchParams.period === "weekly" ? "weekly" : "all";
  const sort = sortKeys.includes(searchParams.sort as SortKey)
    ? (searchParams.sort as SortKey)
    : "rank";
  const query =
    typeof searchParams.q === "string" ? searchParams.q.slice(0, 80) : "";
  const user =
    typeof searchParams.user === "string" && isSnowflake(searchParams.user)
      ? searchParams.user
      : "";

  return (
    <main className="min-h-screen">
      <Leaderboard
        guildID={params.id}
        initialPeriod={period}
        initialQuery={query}
        initialSort={sort}
        initialUser={user}
      />
    </main>
  );
}

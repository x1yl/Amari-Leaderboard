import { Leaderboard } from "@/components/leaderboard";

interface LeaderboardPageProps {
  params: {
    id: string;
  };
}

export default function LeaderboardPage({ params }: LeaderboardPageProps) {
  return (
    <main className="w-full py-4 px-4 sm:py-6 sm:px-8 md:py-8 md:px-12 lg:py-10 lg:px-20 min-h-screen bg-[#1a1b1e]">
      <Leaderboard guildID={params.id} />
    </main>
  );
}

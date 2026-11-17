import { LeaderboardSkeleton } from "@/components/leaderboard/leaderboard-skeleton";
import { Logo } from "@/components/logo";

export default function Loading() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mb-6">
        <Logo showTag={false} />
      </div>
      <LeaderboardSkeleton />
    </main>
  );
}

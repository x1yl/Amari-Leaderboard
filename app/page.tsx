"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [serverId, setServerId] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (serverId.trim()) {
      router.push(`/leaderboard/${serverId.trim()}`);
    }
  };

  return (
    <main className="w-screen h-screen flex flex-col items-center justify-center bg-[#1a1b1e]">
      <div className="w-[90%] max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-bold text-white mb-8">
          Amari Leaderboard
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Enter Discord Server ID"
            value={serverId}
            onChange={(e) => setServerId(e.target.value)}
            className="bg-[#2f3136] border-gray-700 text-white"
          />
          <Button
            type="submit"
            className="w-full bg-[#5865F2] hover:bg-[#4752c4] text-white"
            disabled={!serverId.trim()}
          >
            View Leaderboard
          </Button>
        </form>
      </div>
    </main>
  );
}

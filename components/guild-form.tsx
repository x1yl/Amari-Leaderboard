"use client";

import type React from "react";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Leaderboard } from "./leaderboard";

export default function GuildForm() {
  const [guildId, setGuildId] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guildId) {
      setShowLeaderboard(true);
    }
  };

  if (showLeaderboard) {
    return <Leaderboard guildID={guildId} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-8">
      <div className="space-y-2">
        <label htmlFor="guildId" className="text-sm font-medium text-gray-200">
          Enter Guild ID
        </label>
        <Input
          id="guildId"
          type="text"
          placeholder="Type guild ID here"
          value={guildId}
          onChange={(e) => setGuildId(e.target.value)}
          className="bg-[#2f3136] border-gray-700 text-white"
          required
        />
      </div>
      <Button
        type="submit"
        className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
      >
        Submit
      </Button>
    </form>
  );
}

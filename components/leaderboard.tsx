"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import Image from "next/image";

interface User {
  id: string;
  username: string;
  level: number;
  exp: number;
  avatar?: string;
}

interface GuildInfo {
  name: string;
  iconUrl: string | null;
}

interface LeaderboardProps {
  guildID: string;
}

export function Leaderboard({ guildID }: LeaderboardProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [serverQuery, setServerQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;
  const loadingRef = useRef(null);
  const hasMoreUsers = useRef(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const { isPreloaded, loadedImages } = useImagePreloader(
    users.slice(0, 20).map((user) => user.avatar || ""),
    20
  );
  const [guildInfo, setGuildInfo] = useState<GuildInfo | null>(null);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    return users.filter((user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const displayedUsers = useMemo(() => {
    return filteredUsers.slice(0, page * itemsPerPage);
  }, [filteredUsers, page]);

  const loadMoreUsers = useCallback(() => {
    if (hasMoreUsers.current && displayedUsers.length < filteredUsers.length) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setPage((prevPage) => prevPage + 1);
        setIsLoadingMore(false);
      }, 1000); // Simulate loading delay
    } else {
      hasMoreUsers.current = false;
    }
  }, [displayedUsers.length, filteredUsers.length]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/leaderboard?guildId=${guildID}`);
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const result = await response.json();
        setUsers(result.users);
        setGuildInfo(result.guild);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load leaderboard data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [guildID]);

  useEffect(() => {
    setPage(1);
    hasMoreUsers.current = true;
  }, []);

  useEffect(() => {
    if (isPreloaded && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [isPreloaded, initialLoadComplete]);

  useEffect(() => {
    const currentLoadingRef = loadingRef.current; // Store ref value

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreUsers.current &&
          !isLoadingMore &&
          initialLoadComplete
        ) {
          loadMoreUsers();
        }
      },
      { threshold: 1.0 }
    );

    if (currentLoadingRef) {
      observer.observe(currentLoadingRef);
    }

    return () => {
      if (currentLoadingRef) {
        observer.unobserve(currentLoadingRef);
      }
    };
  }, [loadMoreUsers, isLoadingMore, initialLoadComplete]);

  const handleServerSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && serverQuery.trim()) {
      router.push(`/leaderboard/${serverQuery.trim()}`);
    }
  };

  if (isLoading || !isPreloaded) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
        <div>
          Loading leaderboard{!isLoading && `... (${loadedImages}/20 avatars)`}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          {guildInfo && (
            <>
              {guildInfo.iconUrl ? (
                <Image
                  src={guildInfo.iconUrl}
                  alt={guildInfo.name}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#2f3136] flex items-center justify-center text-2xl text-white">
                  {guildInfo.name[0]}
                </div>
              )}
              <h1 className="text-2xl font-bold text-white">{guildInfo.name}</h1>
            </>
          )}
        </div>
        <div className="relative max-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Enter server ID"
            value={serverQuery}
            onChange={(e) => setServerQuery(e.target.value)}
            onKeyDown={handleServerSearch}
            className="pl-10 bg-[#2f3136] border-gray-700 text-white"
          />
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search users by name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#2f3136] border-gray-700 text-white"
        />
      </div>

      <div className="space-y-2">
        {displayedUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 rounded-lg bg-[#2f3136]"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-white w-6 sm:w-8 shrink-0">
                {users.indexOf(user) + 1}
              </span>
              <Avatar className="hidden md:block h-10 w-10 border border-gray-700 shrink-0">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.username[0]}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-xl text-white truncate min-w-0">
                {user.username}
              </span>
            </div>
            <div className="flex items-center gap-4 sm:gap-8 shrink-0 ml-2">
              <div className="text-right">
                <div className="text-xs sm:text-sm text-gray-400">LEVEL</div>
                <div className="font-semibold text-white">{user.level}</div>
              </div>
              <div className="text-right">
                <div className="text-xs sm:text-sm text-gray-400">EXP</div>
                <div className="font-semibold text-[#ff4500]">
                  {user.exp.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={loadingRef} className="h-16 flex items-center justify-center">
          {isLoadingMore && (
            <div className="flex items-center space-x-2 text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading more users...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

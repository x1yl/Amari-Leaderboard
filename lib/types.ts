export type LeaderboardPeriod = "all" | "weekly";

export interface LeaderboardUser {
  id: string;
  username: string;
  exp: number;
  level: number | null;
  weeklyExp: number | null;
}

export interface LeaderboardPageData {
  users: LeaderboardUser[];
  count: number;
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
  fetchedAt: number;
  stale: boolean;
}

export interface AllLeaderboardData {
  users: LeaderboardUser[];
  totalCount: number;
  truncated: boolean;
  fetchedAt: number;
  stale: boolean;
}

export interface GuildInfo {
  id: string;
  name: string | null;
  iconUrl: string | null;
  onlineCount: number | null;
  memberCount: number | null;
  widgetEnabled: boolean;
}

export interface MemberStats {
  id: string;
  username: string;
  exp: number;
  level: number;
  weeklyExp: number;
}

export interface RecentServer {
  id: string;
  name: string | null;
  iconUrl: string | null;
  lastSeen: number;
}

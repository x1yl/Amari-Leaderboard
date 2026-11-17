"use client";

import { useSyncExternalStore } from "react";

import {
  addRecentServer,
  clearRecentServers,
  getRecentServersSnapshot,
  removeRecentServer,
  subscribeRecentServers,
} from "@/lib/recent-servers";
import type { RecentServer } from "@/lib/types";

const EMPTY: RecentServer[] = [];

export function useRecentServers() {
  const servers = useSyncExternalStore(
    subscribeRecentServers,
    getRecentServersSnapshot,
    () => EMPTY
  );

  return {
    servers,
    add: addRecentServer,
    remove: removeRecentServer,
    clear: clearRecentServers,
  };
}

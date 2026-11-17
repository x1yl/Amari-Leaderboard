import type { RecentServer } from "@/lib/types";

const STORAGE_KEY = "amari-leaderboard:recent-servers";
const MAX_RECENT = 6;
const EMPTY: RecentServer[] = [];

let snapshot: RecentServer[] = EMPTY;
let initialized = false;
const listeners = new Set<() => void>();

function isRecentServer(value: unknown): value is RecentServer {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RecentServer>;
  return (
    typeof candidate.id === "string" &&
    (typeof candidate.name === "string" || candidate.name === null) &&
    (typeof candidate.iconUrl === "string" || candidate.iconUrl === null) &&
    typeof candidate.lastSeen === "number"
  );
}

function read(): RecentServer[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(isRecentServer).slice(0, MAX_RECENT);
  } catch {
    return EMPTY;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function persist(next: RecentServer[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable in private mode; the in-memory list still works.
  }
}

export function getRecentServersSnapshot(): RecentServer[] {
  if (!initialized && typeof window !== "undefined") {
    snapshot = read();
    initialized = true;
  }
  return snapshot;
}

export function subscribeRecentServers(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      snapshot = read();
      emit();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }
  return () => listeners.delete(listener);
}

export function addRecentServer(server: {
  id: string;
  name?: string | null;
  iconUrl?: string | null;
}) {
  const entry: RecentServer = {
    id: server.id,
    name: server.name ?? null,
    iconUrl: server.iconUrl ?? null,
    lastSeen: Date.now(),
  };

  const next = [
    entry,
    ...getRecentServersSnapshot().filter((item) => item.id !== server.id),
  ].slice(0, MAX_RECENT);

  snapshot = next;
  initialized = true;
  persist(next);
  emit();
}

export function removeRecentServer(id: string) {
  const next = getRecentServersSnapshot().filter((item) => item.id !== id);
  snapshot = next;
  initialized = true;
  persist(next);
  emit();
}

export function clearRecentServers() {
  snapshot = EMPTY;
  initialized = true;
  persist([]);
  emit();
}

interface CacheEntry<T> {
  value: T;
  fetchedAt: number;
  expiresAt: number;
  staleUntil: number;
}

export interface CachedResult<T> {
  value: T;
  fetchedAt: number;
  stale: boolean;
}

const MAX_ENTRIES = 250;
const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<CacheEntry<unknown>>>();

function prune() {
  if (store.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now >= entry.staleUntil) store.delete(key);
    if (store.size <= MAX_ENTRIES) return;
  }
  // Still too large: remove oldest entries first.
  const overflow = store.size - MAX_ENTRIES;
  let removed = 0;
  for (const key of store.keys()) {
    store.delete(key);
    removed += 1;
    if (removed >= overflow) break;
  }
}

/**
 * Small TTL cache with single-flight de-duplication and stale-if-error.
 *
 * This protects the Amari API, which allows only 60 requests/minute and
 * returns a 60 minute lockout after a 429. The API route also sends CDN cache
 * headers so shared hosting can absorb most repeat traffic.
 */
export async function cached<T>(
  key: string,
  options: { ttlMs: number; staleMs?: number },
  load: () => Promise<T>
): Promise<CachedResult<T>> {
  const now = Date.now();
  const existing = store.get(key) as CacheEntry<T> | undefined;

  if (existing && now < existing.expiresAt) {
    return {
      value: existing.value,
      fetchedAt: existing.fetchedAt,
      stale: false,
    };
  }

  const pending = inflight.get(key) as Promise<CacheEntry<T>> | undefined;
  if (pending) {
    const entry = await pending;
    return {
      value: entry.value,
      fetchedAt: entry.fetchedAt,
      stale: Date.now() >= entry.expiresAt,
    };
  }

  const startedAt = Date.now();
  const promise = (async (): Promise<CacheEntry<T>> => {
    try {
      const value = await load();
      const entry: CacheEntry<T> = {
        value,
        fetchedAt: startedAt,
        expiresAt: startedAt + options.ttlMs,
        staleUntil: startedAt + options.ttlMs + (options.staleMs ?? 0),
      };
      store.set(key, entry as CacheEntry<unknown>);
      prune();
      return entry;
    } catch (error) {
      if (existing && Date.now() < existing.staleUntil) {
        return existing;
      }
      throw error;
    }
  })();

  inflight.set(key, promise as Promise<CacheEntry<unknown>>);

  try {
    const entry = await promise;
    return {
      value: entry.value,
      fetchedAt: entry.fetchedAt,
      stale: Date.now() >= entry.expiresAt,
    };
  } finally {
    inflight.delete(key);
  }
}

export function peekCache<T>(key: string): CachedResult<T> | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  return {
    value: entry.value,
    fetchedAt: entry.fetchedAt,
    stale: Date.now() >= entry.expiresAt,
  };
}

export function clearCache() {
  store.clear();
  inflight.clear();
}

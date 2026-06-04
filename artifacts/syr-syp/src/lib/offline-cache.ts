const CACHE_KEY = 'syp-qcache-v2';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 120;

interface CacheEntry {
  data: unknown;
  ts: number;
}

function readStore(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CacheEntry>) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, CacheEntry>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {}
}

export function saveQueryToCache(queryKey: unknown[], data: unknown) {
  const store = readStore();
  const key = JSON.stringify(queryKey);
  store[key] = { data, ts: Date.now() };

  const entries = Object.entries(store);
  if (entries.length > MAX_ENTRIES) {
    entries.sort((a, b) => a[1].ts - b[1].ts);
    const toRemove = entries.slice(0, entries.length - MAX_ENTRIES);
    toRemove.forEach(([k]) => delete store[k]);
  }

  writeStore(store);
}

export function loadCachedQueries(): Array<{ queryKey: unknown[]; data: unknown }> {
  const store = readStore();
  const now = Date.now();
  return Object.entries(store)
    .filter(([, v]) => now - v.ts < MAX_AGE_MS)
    .map(([k, v]) => {
      try {
        return { queryKey: JSON.parse(k) as unknown[], data: v.data };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Array<{ queryKey: unknown[]; data: unknown }>;
}

export function clearOfflineCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
}

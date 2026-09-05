/**
 * Small LRU cache with TTL. Used to memoise finished chat answers so repeated
 * questions (the suggested prompts, mostly) never touch a rate-limited
 * provider twice.
 */
export class LRUCache<V> {
  private map = new Map<string, { value: V; expires: number }>();

  constructor(
    private readonly maxEntries: number,
    private readonly ttlMs: number,
  ) {}

  get(key: string, now = Date.now()): V | undefined {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (hit.expires <= now) {
      this.map.delete(key);
      return undefined;
    }
    // Refresh recency.
    this.map.delete(key);
    this.map.set(key, hit);
    return hit.value;
  }

  set(key: string, value: V, now = Date.now()) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expires: now + this.ttlMs });
    while (this.map.size > this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
  }

  get size() {
    return this.map.size;
  }
}

/** Normalise a question so trivial variations share one cache entry. */
export function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

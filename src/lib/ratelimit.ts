/**
 * In-memory rate limiting.
 *
 * Two flavours:
 *  - `Budget`: a per-provider budget with a per-minute and a per-day cap.
 *    Used to stay inside the free-tier quotas of Gemini and OpenAI so the
 *    route can fall back to Groq before the upstream returns 429.
 *  - `SlidingWindow`: a per-client limiter keyed by IP to stop one visitor
 *    from burning the whole budget.
 *
 * State lives in module scope, so it is per server instance. On serverless
 * platforms that means "per warm lambda", which is still a useful guard and
 * needs no external store.
 */

export interface BudgetSnapshot {
  minuteUsed: number;
  minuteLimit: number;
  dayUsed: number;
  dayLimit: number;
  retryAfterMs: number;
}

export class Budget {
  private minuteHits: number[] = [];
  private dayHits: number[] = [];
  /** Set when upstream tells us to back off (429). */
  private cooldownUntil = 0;

  constructor(
    public readonly name: string,
    public readonly perMinute: number,
    public readonly perDay: number,
  ) {}

  private prune(now: number) {
    const minuteAgo = now - 60_000;
    const dayAgo = now - 86_400_000;
    while (this.minuteHits.length && this.minuteHits[0] <= minuteAgo) {
      this.minuteHits.shift();
    }
    while (this.dayHits.length && this.dayHits[0] <= dayAgo) {
      this.dayHits.shift();
    }
  }

  /** Reserve one call if the budget allows it. */
  tryConsume(now = Date.now()): boolean {
    this.prune(now);
    if (now < this.cooldownUntil) return false;
    if (this.minuteHits.length >= this.perMinute) return false;
    if (this.dayHits.length >= this.perDay) return false;
    this.minuteHits.push(now);
    this.dayHits.push(now);
    return true;
  }

  /** Give a reservation back, e.g. when a cached answer was served instead. */
  refund() {
    this.minuteHits.pop();
    this.dayHits.pop();
  }

  /** Called when upstream returned 429 or a quota error. */
  cooldown(ms: number, now = Date.now()) {
    this.cooldownUntil = Math.max(this.cooldownUntil, now + ms);
  }

  snapshot(now = Date.now()): BudgetSnapshot {
    this.prune(now);
    const untilMinute =
      this.minuteHits.length >= this.perMinute
        ? this.minuteHits[0] + 60_000 - now
        : 0;
    const untilDay =
      this.dayHits.length >= this.perDay ? this.dayHits[0] + 86_400_000 - now : 0;
    const untilCooldown = Math.max(0, this.cooldownUntil - now);
    return {
      minuteUsed: this.minuteHits.length,
      minuteLimit: this.perMinute,
      dayUsed: this.dayHits.length,
      dayLimit: this.perDay,
      retryAfterMs: Math.max(untilMinute, untilDay, untilCooldown),
    };
  }
}

export class SlidingWindow {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** Returns 0 if allowed, otherwise the number of ms until a slot frees up. */
  check(key: string, now = Date.now()): number {
    const cutoff = now - this.windowMs;
    const list = (this.hits.get(key) ?? []).filter((t) => t > cutoff);
    if (list.length >= this.limit) {
      this.hits.set(key, list);
      return list[0] + this.windowMs - now;
    }
    list.push(now);
    this.hits.set(key, list);
    // Opportunistic cleanup so the map cannot grow without bound.
    if (this.hits.size > 5000) {
      for (const [k, v] of this.hits) {
        if (!v.some((t) => t > cutoff)) this.hits.delete(k);
      }
    }
    return 0;
  }
}

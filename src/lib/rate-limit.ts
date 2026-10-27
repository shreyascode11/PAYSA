import "server-only";
import { createHash } from "node:crypto";

interface Bucket {
  tokens: number;
  updated: number;
}

// Shared across route bundles in one process (see secret.ts).
const g = globalThis as typeof globalThis & { __paysaBuckets?: Map<string, Bucket> };
const buckets = (g.__paysaBuckets ??= new Map<string, Bucket>());
const MAX_BUCKETS = 10_000;

export interface Limit {
  capacity: number;
  refillPerMinute: number;
}

export const LIMITS = {
  login: { capacity: 5, refillPerMinute: 5 },
  report: { capacity: 5, refillPerMinute: 2 },
  voice: { capacity: 6, refillPerMinute: 6 },
  pulse: { capacity: 3, refillPerMinute: 1 },
} satisfies Record<string, Limit>;

/** Caller key from the proxy header; hashed so raw IPs never sit in memory next to report traffic. */
export function clientKey(req: Request, scope: string): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return `${scope}:${createHash("sha256").update(ip).digest("hex").slice(0, 16)}`;
}

/** In-memory token bucket; returns true when the request may proceed. */
export function take(key: string, limit: Limit, now = Date.now()): boolean {
  const b = buckets.get(key) ?? { tokens: limit.capacity, updated: now };
  const refill = ((now - b.updated) / 60_000) * limit.refillPerMinute;
  b.tokens = Math.min(limit.capacity, b.tokens + refill);
  b.updated = now;
  if (buckets.size >= MAX_BUCKETS && !buckets.has(key)) buckets.clear();
  buckets.set(key, b);
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  return true;
}

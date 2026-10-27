import "server-only";
import { randomBytes } from "node:crypto";

// On globalThis because Next.js may load this module once per route bundle; all must share one secret.
const g = globalThis as typeof globalThis & { __paysaSecret?: string };

/**
 * SESSION_SECRET signs sessions and site QR tokens. Without it (zero-config demo) we use a random
 * per-process secret: everything works, but sessions and printed QRs reset on restart.
 */
export function sessionSecret(): string {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  if (!g.__paysaSecret) {
    g.__paysaSecret = randomBytes(32).toString("hex");
    console.warn("[paysa] SESSION_SECRET missing or < 32 chars; using an ephemeral secret.");
  }
  return g.__paysaSecret;
}

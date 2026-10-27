import "server-only";
import { randomBytes } from "node:crypto";

let fallback: string | undefined;

/**
 * SESSION_SECRET signs sessions and site QR tokens. Without it (zero-config demo) we use a random
 * per-process secret: everything works, but sessions and printed QRs reset on restart.
 */
export function sessionSecret(): string {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  if (!fallback) {
    fallback = randomBytes(32).toString("hex");
    console.warn("[fairshift] SESSION_SECRET missing or < 32 chars; using an ephemeral secret.");
  }
  return fallback;
}

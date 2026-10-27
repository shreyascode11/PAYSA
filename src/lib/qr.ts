import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { localDateKey } from "./time";
import { sessionSecret } from "./secret";

/** Site QR tokens rotate daily: a photo of yesterday's poster can't be used to check in from home. */
export function siteToken(siteId: string, dateKey: string): string {
  return createHmac("sha256", sessionSecret()).update(`${siteId}:${dateKey}`).digest("base64url").slice(0, 12);
}

export function todaysSiteToken(siteId: string, now = new Date()): string {
  return siteToken(siteId, localDateKey(now));
}

export function verifySiteToken(siteId: string, token: string, now = new Date()): boolean {
  const expected = Buffer.from(todaysSiteToken(siteId, now));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function checkinUrl(origin: string, siteId: string, token: string): string {
  const u = new URL("/w/checkin", origin);
  u.searchParams.set("site", siteId);
  u.searchParams.set("t", token);
  return u.toString();
}

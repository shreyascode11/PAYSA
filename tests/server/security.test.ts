import { describe, expect, it } from "vitest";
import { signSession, verifySecret, verifySession } from "@/lib/auth";
import { siteToken, todaysSiteToken, verifySiteToken } from "@/lib/qr";
import { LIMITS, take } from "@/lib/rate-limit";

describe("sessions", () => {
  it("round-trips worker and admin sessions", async () => {
    expect(await verifySession(await signSession({ role: "worker", sub: "w1", orgId: "o1" }))).toEqual({ role: "worker", sub: "w1", orgId: "o1" });
    expect(await verifySession(await signSession({ role: "admin", sub: "a1", orgIds: ["o1", "o2"] }))).toEqual({ role: "admin", sub: "a1", orgIds: ["o1", "o2"] });
  });

  it("rejects tampered, empty or garbage tokens", async () => {
    const token = await signSession({ role: "worker", sub: "w1", orgId: "o1" });
    const [h, p, sig] = token.split(".");
    const forged = `${h}.${Buffer.from(JSON.stringify({ role: "admin", sub: "w1", orgIds: ["o1"] })).toString("base64url")}.${sig}`;
    expect(await verifySession(forged)).toBeNull();
    expect(await verifySession(`${h}.${p}.AAAA`)).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession("not-a-jwt")).toBeNull();
  });

  it("verifies secrets against bcrypt hashes and fails safely for unknown accounts", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("1234", 4);
    expect(await verifySecret("1234", hash)).toBe(true);
    expect(await verifySecret("9999", hash)).toBe(false);
    expect(await verifySecret("1234", undefined)).toBe(false);
  });
});

describe("site QR tokens", () => {
  const now = new Date("2026-10-27T06:00:00Z");

  it("accepts today's token and rejects yesterday's, other sites' and malformed tokens", () => {
    const token = todaysSiteToken("site-1", now);
    expect(verifySiteToken("site-1", token, now)).toBe(true);
    expect(verifySiteToken("site-1", siteToken("site-1", "2026-10-26"), now)).toBe(false);
    expect(verifySiteToken("site-2", token, now)).toBe(false);
    expect(verifySiteToken("site-1", "short", now)).toBe(false);
  });

  it("rotates at local (IST) midnight", () => {
    const beforeMidnight = new Date("2026-10-27T18:29:00Z");
    const afterMidnight = new Date("2026-10-27T18:31:00Z");
    expect(todaysSiteToken("site-1", beforeMidnight)).not.toBe(todaysSiteToken("site-1", afterMidnight));
  });
});

describe("rate limiter", () => {
  it("allows a burst up to capacity, then refills over time", () => {
    const key = `test:${Math.random()}`;
    const t0 = 1_000_000;
    const allowed = Array.from({ length: LIMITS.login.capacity + 2 }, () => take(key, LIMITS.login, t0)).filter(Boolean).length;
    expect(allowed).toBe(LIMITS.login.capacity);
    expect(take(key, LIMITS.login, t0)).toBe(false);
    expect(take(key, LIMITS.login, t0 + 60_000)).toBe(true);
  });
});

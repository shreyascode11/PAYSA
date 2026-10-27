import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { buildSeed } from "@/data/seed";
import { signSession, type Session } from "@/lib/auth";
import { todaysSiteToken } from "@/lib/qr";
import { MemoryRepository } from "@/lib/repo/memory";
import type { Repository } from "@/lib/repo/types";

// A tiny in-test cookie jar standing in for Next's request-scoped cookie store.
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
  headers: async () => new Headers({ host: "localhost:3000" }),
}));

let repo: MemoryRepository;
let ip = 0;
const json = (body: unknown, method = "POST") =>
  new Request("http://localhost:3000/api", {
    method,
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${++ip}` },
    body: JSON.stringify(body),
  });
const login = async (s: Session) => jar.set("fs_session", await signSession(s));
const params = <T,>(p: T) => ({ params: Promise.resolve(p) });

beforeAll(() => {
  const hash = bcrypt.hashSync("1234", 4);
  repo = new MemoryRepository(buildSeed(new Date(), hash, bcrypt.hashSync("demo1234", 4)));
  (globalThis as { __paysaRepo?: Repository }).__paysaRepo = repo;
});
beforeEach(() => jar.clear());

describe("auth routes", () => {
  it("logs a worker in with the right PIN only", async () => {
    const { POST } = await import("@/app/api/auth/worker-login/route");
    expect((await POST(json({ phone: "9000000001", pin: "0000" }))).status).toBe(401);
    expect(jar.has("fs_session")).toBe(false);
    const ok = await POST(json({ phone: "9000000001", pin: "1234" }));
    expect(ok.status).toBe(200);
    expect(jar.has("fs_session")).toBe(true);
  });

  it("rejects malformed admin login input with 400", async () => {
    const { POST } = await import("@/app/api/auth/admin-login/route");
    expect((await POST(json({ email: "not-an-email", password: "x" }))).status).toBe(400);
  });
});

describe("shift check-in / check-out", () => {
  it("requires a session", async () => {
    const { POST } = await import("@/app/api/shifts/check-in/route");
    expect((await POST(json({ method: "geo", lat: 12.8452, lng: 80.0603 }))).status).toBe(401);
  });

  it("geofences, blocks double check-in and closes the shift", async () => {
    await login({ role: "worker", sub: "w-c01", orgId: "org-con" });
    const checkIn = (await import("@/app/api/shifts/check-in/route")).POST;
    const checkOut = (await import("@/app/api/shifts/check-out/route")).POST;

    const far = await checkIn(json({ method: "geo", lat: 13.08, lng: 80.27 }));
    expect(far.status).toBe(400);
    expect(await far.json()).toMatchObject({ error: "outside" });

    expect((await checkIn(json({ method: "geo", lat: 12.8452, lng: 80.0603 }))).status).toBe(200);
    expect((await checkIn(json({ method: "geo", lat: 12.8452, lng: 80.0603 }))).status).toBe(409);
    expect((await checkOut(json({}))).status).toBe(200);
    expect((await checkOut(json({}))).status).toBe(409);
  });

  it("accepts today's site QR and rejects a forged one", async () => {
    await login({ role: "worker", sub: "w-c02", orgId: "org-con" });
    const { POST } = await import("@/app/api/shifts/check-in/route");
    const forged = await POST(json({ method: "qr", siteId: "site-con-1", qrToken: "AAAAAAAAAAAA" }));
    expect(await forged.json()).toMatchObject({ error: "expired_qr" });
    expect((await POST(json({ method: "qr", siteId: "site-con-1", qrToken: todaysSiteToken("site-con-1") }))).status).toBe(200);
  });

  it("tells a worker when a QR belongs to another employer's site", async () => {
    // The college demo worker starts each day checked out, so the site check is what answers.
    await login({ role: "worker", sub: "w-k01", orgId: "org-col" });
    const { POST } = await import("@/app/api/shifts/check-in/route");
    const res = await POST(json({ method: "qr", siteId: "site-con-1", qrToken: todaysSiteToken("site-con-1") }));
    expect(await res.json()).toMatchObject({ error: "wrong_site" });
    const unknown = await POST(json({ method: "qr", siteId: "no-such-site", qrToken: "AAAAAAAAAAAA" }));
    expect(await unknown.json()).toMatchObject({ error: "bad_qr" });
  });
});

describe("pulse", () => {
  it("accepts one answer per week and stores no worker id", async () => {
    await login({ role: "worker", sub: "w-k02", orgId: "org-col" });
    const { POST } = await import("@/app/api/pulse/route");
    const before = (await repo.listPulses("org-col")).length;
    expect((await POST(json({ score: 4 }))).status).toBe(201);
    expect((await POST(json({ score: 4 }))).status).toBe(409);
    const pulses = await repo.listPulses("org-col");
    expect(pulses).toHaveLength(before + 1);
    expect(JSON.stringify(pulses.at(-1))).not.toContain("w-k02");
  });
});

describe("report submission", () => {
  it("stores an anonymous report without the worker's id", async () => {
    await login({ role: "worker", sub: "w-c03", orgId: "org-con" });
    const { POST } = await import("@/app/api/reports/route");
    const form = new FormData();
    for (const [k, v] of Object.entries({ type: "hazard", category: "other", text: "Open wire near water", lang: "en", anonymous: "true" })) form.set(k, v);
    const res = await POST(new Request("http://localhost:3000/api/reports", { method: "POST", body: form, headers: { "x-forwarded-for": "10.9.9.9" } }));
    expect(res.status).toBe(201);
    const { trackingId } = (await res.json()) as { trackingId: string };
    const stored = await repo.findReportByTracking(trackingId);
    expect(stored?.workerId).toBeUndefined();
    expect(stored?.category).toBe("electrical");
  });
});

describe("admin authorization", () => {
  it("lets an admin update reports only in organisations they manage", async () => {
    await login({ role: "admin", sub: "ad-x", orgIds: ["org-con"] });
    const { PATCH } = await import("@/app/api/admin/reports/[id]/route");
    const other = await PATCH(json({ status: "in_review", note: "" }, "PATCH"), params({ id: "rp-9" }));
    expect(other.status).toBe(403);
    const own = await PATCH(json({ status: "action_taken", note: "Guard rail fixed" }, "PATCH"), params({ id: "rp-1" }));
    expect(own.status).toBe(200);
    expect((await repo.getReport("rp-1"))?.updates.at(-1)).toMatchObject({ status: "action_taken", note: "Guard rail fixed" });
  });

  it("returns 401 to workers and 404 for unknown entities", async () => {
    const { POST } = await import("@/app/api/admin/skills/endorse/route");
    await login({ role: "worker", sub: "w-c01", orgId: "org-con" });
    expect((await POST(json({ workerId: "w-c01", skill: "masonry" }))).status).toBe(401);
    await login({ role: "admin", sub: "ad-1", orgIds: ["org-con", "org-col"] });
    expect((await POST(json({ workerId: "nobody", skill: "masonry" }))).status).toBe(404);
    expect((await POST(json({ workerId: "w-c01", skill: "gardening" }))).status).toBe(400);
    expect((await POST(json({ workerId: "w-c01", skill: "welding" }))).status).toBe(201);
  });
});

import { beforeAll, describe, expect, it } from "vitest";
import { buildSeed } from "@/data/seed";
import { MemoryRepository } from "@/lib/repo/memory";
import type { Repository } from "@/lib/repo/types";
import { addMessage, createReport, toPublicReport } from "@/lib/services/reports";
import type { Org } from "@/lib/types";
import { GET as trackGet } from "@/app/api/reports/track/[trackingId]/route";

const now = new Date("2026-10-27T11:47:13+05:30");
let repo: MemoryRepository;
let org: Org;

beforeAll(async () => {
  delete process.env.GEMINI_API_KEY;
  repo = new MemoryRepository(buildSeed(now, "pin", "pw"));
  // The route handler reads the process-wide repository.
  (globalThis as { __paysaRepo?: Repository }).__paysaRepo = repo;
  org = (await repo.getOrg("org-con")) as Org;
});

const IDENTITY_KEYS = ["workerId", "phone", "name", "ip", "siteId", "anonymous"];

function expectNoIdentity(obj: unknown) {
  const json = JSON.stringify(obj);
  for (const k of IDENTITY_KEYS) expect(json).not.toContain(`"${k}"`);
  expect(json).not.toContain("w-c01");
  expect(json).not.toContain("Murugan");
}

describe("anonymous reports", () => {
  it("stores no workerId and only an hour-precision timestamp", async () => {
    const r = await createReport(
      repo,
      { org, workerId: "w-c01", type: "hazard", category: "other", text: "No helmets on site", lang: "en", anonymous: true },
      now,
    );
    const stored = await repo.findReportByTracking(r.trackingId);
    expect(stored).toBeDefined();
    expect(stored).not.toHaveProperty("workerId");
    expect(stored?.createdAt).toBe("2026-10-27T06:00:00.000Z");
    expect(stored?.updates[0]?.at).toBe("2026-10-27T06:00:00.000Z");
    expect(JSON.stringify(stored)).not.toContain("w-c01");
    expect(stored?.category).toBe("ppe_missing");
  });

  it("keeps the worker id when the worker chose to be named", async () => {
    const r = await createReport(
      repo,
      { org, workerId: "w-c01", type: "grievance", category: "pay", text: "Wages late", lang: "en", anonymous: false },
      now,
    );
    expect((await repo.getReport(r.id))?.workerId).toBe("w-c01");
  });

  it("the public track endpoint returns status but no identity, even for named reports", async () => {
    for (const anonymous of [true, false]) {
      const r = await createReport(
        repo,
        { org, workerId: "w-c01", type: "hazard", category: "heat", text: "Too hot", lang: "en", anonymous },
        now,
      );
      const res = await trackGet(new Request(`http://x/api/reports/track/${r.trackingId}`), {
        params: Promise.resolve({ trackingId: r.trackingId.toLowerCase() }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { status: string; trackingId: string };
      expect(body.status).toBe("received");
      expect(body.trackingId).toBe(r.trackingId);
      expectNoIdentity(body);
    }
  });

  it("returns 404 for unknown or malformed codes", async () => {
    for (const code of ["PS-ZZZZZZ", "not-a-code"]) {
      const res = await trackGet(new Request("http://x"), { params: Promise.resolve({ trackingId: code }) });
      expect(res.status).toBe(404);
    }
  });

  it("anonymous chat replies keep only hour-level timing", async () => {
    const r = await createReport(
      repo,
      { org, workerId: "w-c01", type: "hazard", category: "heat", text: "Too hot", lang: "en", anonymous: true },
      now,
    );
    const withReply = addMessage(r, "worker", "Near the slab", now);
    expect(withReply.messages[0]?.at).toBe("2026-10-27T06:00:00.000Z");
    expectNoIdentity(toPublicReport(withReply));
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildSeed } from "@/data/seed";

type Doc = Record<string, unknown>;
type Filter = { field: string; op: "==" | "in" | ">="; value: unknown };

/** Minimal in-memory stand-in for the parts of the Firestore API the repository uses. */
class FakeFirestore {
  data = new Map<string, Map<string, Doc>>();
  inQueries: number[] = [];
  settings() {}
  private col(name: string) {
    if (!this.data.has(name)) this.data.set(name, new Map());
    return this.data.get(name) as Map<string, Doc>;
  }
  collection(name: string) {
    const col = this.col(name);
    const query = (filters: Filter[]) => ({
      where: (field: string, op: Filter["op"], value: unknown) => query([...filters, { field, op, value }]),
      get: async () => {
        for (const f of filters) if (f.op === "in") this.inQueries.push((f.value as unknown[]).length);
        const docs = [...col.values()].filter((d) =>
          filters.every((f) => (f.op === "==" ? d[f.field] === f.value : f.op === "in" ? (f.value as unknown[]).includes(d[f.field]) : String(d[f.field]) >= String(f.value))),
        );
        return { docs: docs.map((d) => ({ data: () => d })) };
      },
    });
    return {
      ...query([]),
      doc: (id: string) => ({
        id,
        col,
        get: async () => ({ exists: col.has(id), data: () => col.get(id) }),
        set: async (d: Doc) => void col.set(id, structuredClone(d)),
        create: async (d: Doc) => {
          if (col.has(id)) throw new Error("ALREADY_EXISTS");
          col.set(id, d);
        },
      }),
    };
  }
  batch() {
    const ops: (() => void)[] = [];
    return {
      set: (ref: { col: Map<string, Doc>; id: string }, d: Doc) => ops.push(() => ref.col.set(ref.id, structuredClone(d))),
      commit: async () => ops.forEach((op) => op()),
    };
  }
  async runTransaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
    return fn({
      get: async (ref: { col: Map<string, Doc>; id: string }) => ({ data: () => ref.col.get(ref.id) }),
      update: (ref: { col: Map<string, Doc>; id: string }, patch: Doc) => ref.col.set(ref.id, { ...ref.col.get(ref.id), ...patch }),
    });
  }
}

const fake = new FakeFirestore();
vi.mock("firebase-admin/app", () => ({ initializeApp: () => ({}), getApps: () => [], applicationDefault: () => ({}), cert: (o: object) => o }));
vi.mock("firebase-admin/firestore", () => ({ getFirestore: () => fake }));

const now = new Date("2026-10-27T11:00:00+05:30");

describe("FirestoreRepository", () => {
  beforeEach(() => {
    fake.inQueries = [];
  });

  it("seeds an empty project exactly once and reads it back", async () => {
    const { FirestoreRepository } = await import("@/lib/repo/firestore");
    const seed = vi.fn(() => buildSeed(now, "pin", "pw"));
    const a = new FirestoreRepository("proj", seed);
    const b = new FirestoreRepository("proj", seed);
    expect((await a.listOrgs()).length).toBe(2);
    expect((await b.listOrgs()).length).toBe(2);
    expect(seed).toHaveBeenCalledTimes(1);
    expect((await a.findWorkerByPhone("9000000001"))?.id).toBe("w-c01");
    expect((await a.findAdminByEmail(" ADMIN@paysa.demo "))?.id).toBe("ad-1");
    expect((await a.findReportByTracking("PS-7K2Q9M"))?.severity).toBe(4);
  });

  it("queries per-worker collections with chunked 'in' filters (≤ 30 ids each)", async () => {
    const { FirestoreRepository } = await import("@/lib/repo/firestore");
    const repo = new FirestoreRepository("proj", () => buildSeed(now, "pin", "pw"));
    const ids = Array.from({ length: 65 }, (_, i) => (i === 0 ? "w-c01" : `x-${i}`));
    const records = await repo.listPayRecords(ids);
    expect(records.length).toBeGreaterThan(0);
    expect(records.every((r) => r.workerId === "w-c01")).toBe(true);
    expect(fake.inQueries).toEqual([30, 30, 5]);
    expect(await repo.listFatigueActions([])).toEqual([]);
  });

  it("filters shifts by worker, org and date, and closes a shift only once", async () => {
    const { FirestoreRepository } = await import("@/lib/repo/firestore");
    const repo = new FirestoreRepository("proj", () => buildSeed(now, "pin", "pw"));
    const since = new Date(now.getTime() - 7 * 86_400_000).toISOString();
    const mine = await repo.listShifts({ workerId: "w-c01", since });
    expect(mine.every((s) => s.workerId === "w-c01" && s.checkIn >= since)).toBe(true);
    const org = await repo.listShifts({ orgId: "org-col", since });
    expect(org.every((s) => s.workerId.startsWith("w-k"))).toBe(true);

    await repo.addShift({ id: "fs-1", workerId: "w-c01", siteId: "site-con-1", checkIn: now.toISOString(), method: "geo" });
    expect((await repo.getOpenShift("w-c01"))?.id).toBe("fs-1");
    expect((await repo.closeShift("fs-1", new Date(now.getTime() + 3_600_000).toISOString()))?.checkOut).toBeDefined();
    expect(await repo.closeShift("fs-1", now.toISOString())).toBeUndefined();
  });

  it("orders announcements newest first and saves reports and skills", async () => {
    const { FirestoreRepository } = await import("@/lib/repo/firestore");
    const repo = new FirestoreRepository("proj", () => buildSeed(now, "pin", "pw"));
    await repo.addAnnouncement({ id: "an-new", orgId: "org-con", text: "New", lang: "en", createdAt: now.toISOString() });
    expect((await repo.listAnnouncements("org-con"))[0]?.id).toBe("an-new");
    const r = (await repo.getReport("rp-1"))!;
    await repo.saveReport({ ...r, status: "resolved" });
    expect((await repo.getReport("rp-1"))?.status).toBe("resolved");
    await repo.saveSkill({ id: "sk-new", workerId: "w-c02", skill: "welding", level: 1, source: "employer", endorsedBy: "org-con", date: "2026-10-27" });
    expect((await repo.listSkills("w-c02")).some((s) => s.id === "sk-new")).toBe(true);
    expect(await repo.getSite("")).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { buildSeed } from "@/data/seed";
import { createMemoryRepository } from "@/lib/repo";
import { MemoryRepository } from "@/lib/repo/memory";
import { computeOvertime } from "@/lib/rules/overtime";
import { loadOrgData, overview, weeklyHours } from "@/lib/services/admin";
import { loadWorker, workerPayslip, workerStreak, workerSummary } from "@/lib/services/worker";
import { addDays, localDateKey, weekStartKey } from "@/lib/time";

const now = new Date("2026-10-27T11:00:00+05:30"); // a Tuesday
const repo = new MemoryRepository(buildSeed(now, "pin", "pw"));

describe("worker services", () => {
  it("summarises today, this week and fatigue", async () => {
    const ctx = await loadWorker(repo, "w-c01");
    expect(ctx?.org.sector).toBe("construction");
    const s = await workerSummary(repo, ctx!, now);
    expect(s.weekHours).toBeGreaterThan(0);
    expect(s.weekOtHours).toBeLessThanOrEqual(s.weekHours);
    expect(["ok", "warn", "critical"]).toContain(s.fatigue.level);
  });

  it("defaults the payslip to last completed week and never shows the future", async () => {
    const ctx = (await loadWorker(repo, "w-c01"))!;
    const last = await workerPayslip(repo, ctx, "en", undefined, now);
    expect(last.weekStart).toBe(addDays(weekStartKey(localDateKey(now)), -7));
    expect(last.hasNext).toBe(true);
    expect(last.sentences.length).toBeGreaterThanOrEqual(3);
    const future = await workerPayslip(repo, ctx, "en", "2027-01-04", now);
    expect(future.weekStart).toBe(weekStartKey(localDateKey(now)));
    expect(future.hasNext).toBe(false);
  });

  it("builds a 5-week Mon–Sun streak with future days marked", async () => {
    const { weeks, worked } = await workerStreak(repo, "w-c01", 5, now);
    expect(weeks).toHaveLength(5);
    expect(weeks.every((w) => w.days.length === 7)).toBe(true);
    expect(weeks.at(-1)?.days.at(-1)?.state).toBe("future");
    expect(worked).toBe(weeks.flatMap((w) => w.days).filter((d) => d.state === "worked").length);
  });
});

describe("admin services", () => {
  it("weekly hours match a naive per-worker computation", async () => {
    const data = (await loadOrgData(repo, "org-con", now))!;
    const fast = weeklyHours(data, now, 4);
    for (const row of fast) {
      const end = addDays(row.weekStart, 6);
      let regular = 0;
      let overtime = 0;
      for (const w of data.workers) {
        const own = data.shifts.filter((s) => s.workerId === w.id && s.checkOut && localDateKey(s.checkIn) >= row.weekStart && localDateKey(s.checkIn) <= end);
        const ot = computeOvertime(own);
        regular += ot.regularHours;
        overtime += ot.otHours;
      }
      // The fast path also counts open (in-progress) shifts up to now, so it can only be ≥ the closed-only total.
      expect(row.regular + row.overtime).toBeGreaterThanOrEqual(Math.round(regular + overtime) - 1);
      if (row.weekStart < weekStartKey(localDateKey(now))) {
        expect(row.regular).toBe(Math.round(regular));
        expect(row.overtime).toBe(Math.round(overtime));
      }
    }
  });

  it("produces consistent overview numbers", async () => {
    const data = (await loadOrgData(repo, "org-col", now))!;
    const ov = await overview(repo, data, now);
    expect(ov.attendance).toHaveLength(14);
    expect(ov.attendance.every((a) => a.present <= ov.workforce && a.rate <= 100)).toBe(true);
    expect(ov.people).toHaveLength(data.workers.length);
    expect(ov.highRisk).toBe(ov.people.filter((p) => p.risk.band === "high").length);
    expect(ov.onSiteNow).toBeLessThanOrEqual(ov.workforce);
    expect(Object.values(ov.openBySeverity).reduce((a, n) => a + n, 0)).toBeGreaterThan(0);
  });

  it("creates a seeded repository from the factory", async () => {
    const fresh = createMemoryRepository(now);
    expect((await fresh.listOrgs()).map((o) => o.sector).sort()).toEqual(["college", "construction"]);
  });
});

describe("memory repository", () => {
  it("hands out frozen records so callers cannot corrupt the store", async () => {
    const w = await repo.getWorker("w-c01");
    expect(Object.isFrozen(w)).toBe(true);
    expect(() => {
      (w as { name: string }).name = "x";
    }).toThrow();
  });

  it("closes a shift by replacing it, once", async () => {
    await repo.addShift({ id: "t-1", workerId: "w-c13", siteId: "site-con-2", checkIn: now.toISOString(), method: "geo" });
    const closed = await repo.closeShift("t-1", new Date(now.getTime() + 3_600_000).toISOString());
    expect(closed?.checkOut).toBeDefined();
    expect(await repo.closeShift("t-1", now.toISOString())).toBeUndefined();
  });
});

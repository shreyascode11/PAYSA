import { describe, expect, it } from "vitest";
import { MemoryRepository } from "@/lib/repo/memory";
import { buildSeed } from "@/data/seed";
import { TRACKING_ID_PATTERN } from "@/lib/rules/anonymity";
import { attritionTable, fatigueGrid, loadOrgData, overview } from "@/lib/services/admin";

const now = new Date("2026-10-27T11:00:00+05:30");
const repo = new MemoryRepository(buildSeed(now, "pin-hash", "admin-hash"));

describe.each(["org-con", "org-col"])("seed for %s", (orgId) => {
  it("shows realistic fatigue, attrition and the k-anonymity gate", async () => {
    const data = await loadOrgData(repo, orgId, now);
    expect(data).not.toBeNull();
    if (!data) return;
    const attr = await attritionTable(repo, data, now);
    const grid = await fatigueGrid(repo, data, now);
    const ov = await overview(repo, data, now);

    const bands = attr.map((r) => r.result.band);
    const levels = grid.rows.flatMap((r) => r.cells.map((c) => c.result.level));
    expect(bands).toContain("high");
    expect(levels).toContain("critical");
    expect(levels).toContain("warn");
    expect(ov.criticalReports.length).toBeGreaterThan(0);
    for (const r of attr) {
      if (r.result.score > 0) expect(r.result.drivers.length).toBeGreaterThan(0);
    }
  });
});

it("hides the 4-person college maintenance team's mood (k < 5)", async () => {
  const data = await loadOrgData(repo, "org-col", now);
  const ov = data && (await overview(repo, data, now));
  expect(ov?.teamPulse.find((t) => t.teamId === "col-mt")?.average).toBeNull();
});

it("only uses tracking codes a worker can actually look up", () => {
  for (const r of buildSeed(now, "pin", "pw").reports) expect(r.trackingId).toMatch(TRACKING_ID_PATTERN);
});

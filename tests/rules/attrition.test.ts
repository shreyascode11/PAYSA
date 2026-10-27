import { describe, expect, it } from "vitest";
import {
  bandFor,
  deriveAttritionSignals,
  scoreAttrition,
  type AttritionInput,
  type AttritionSignals,
} from "@/lib/rules/attrition";
import { addDays, dayRange } from "@/lib/time";
import { dayShift } from "../helpers";

const calm: AttritionSignals = {
  absencesRecent: 1,
  absencesBaseline: 1,
  fatigueDays: 0,
  maxWeeklyHours: 44,
  latePay: false,
  teamPulseAvg: 4,
  tenureDays: 400,
  teamSilent: false,
};

const codes = (s: Partial<AttritionSignals>): string[] =>
  scoreAttrition({ ...calm, ...s }).drivers.map((d) => d.code);

describe("scoreAttrition drivers", () => {
  it("scores a calm worker as 0 / low with no drivers", () => {
    expect(scoreAttrition(calm)).toEqual({ score: 0, band: "low", drivers: [] });
  });

  it("adds 20 when absences are up by 2 or more vs baseline", () => {
    expect(codes({ absencesRecent: 3 })).toEqual(["absences_up"]);
    expect(codes({ absencesRecent: 2 })).toEqual([]);
    expect(scoreAttrition({ ...calm, absencesRecent: 3 }).score).toBe(20);
  });

  it("adds 5 per fatigue day, capped at 20", () => {
    expect(scoreAttrition({ ...calm, fatigueDays: 2 }).score).toBe(10);
    expect(scoreAttrition({ ...calm, fatigueDays: 9 }).score).toBe(20);
  });

  it("adds 15 for a week over 54h", () => {
    expect(scoreAttrition({ ...calm, maxWeeklyHours: 56 }).score).toBe(15);
    expect(scoreAttrition({ ...calm, maxWeeklyHours: 54 }).score).toBe(0);
  });

  it("adds 20 for late or missed pay", () => {
    expect(scoreAttrition({ ...calm, latePay: true }).drivers[0]).toMatchObject({ code: "late_pay", points: 20, action: "check_pay" });
  });

  it("adds 10 for low team mood, but not when the mood is hidden by k-anonymity", () => {
    expect(scoreAttrition({ ...calm, teamPulseAvg: 2 }).score).toBe(10);
    expect(scoreAttrition({ ...calm, teamPulseAvg: null }).score).toBe(0);
  });

  it("adds 10 for tenure under 90 days and 5 for a silent team", () => {
    expect(scoreAttrition({ ...calm, tenureDays: 30 }).score).toBe(10);
    expect(scoreAttrition({ ...calm, teamSilent: true }).score).toBe(5);
  });

  it("sorts drivers by points and always explains the score", () => {
    const r = scoreAttrition({ ...calm, teamSilent: true, latePay: true, maxWeeklyHours: 60, fatigueDays: 4 });
    expect(r.drivers.map((d) => d.points)).toEqual([20, 20, 15, 5]);
    expect(r.score).toBe(60);
    expect(r.band).toBe("high");
    for (const d of r.drivers) expect(d.detail.length).toBeGreaterThan(0);
  });

  it("caps the score at 100", () => {
    const r = scoreAttrition({
      absencesRecent: 9, absencesBaseline: 0, fatigueDays: 10, maxWeeklyHours: 70,
      latePay: true, teamPulseAvg: 1, tenureDays: 10, teamSilent: true,
    });
    expect(r.score).toBe(100);
  });
});

describe("bandFor", () => {
  it("bands 0–29 low, 30–59 medium, 60+ high", () => {
    expect([0, 29, 30, 59, 60, 100].map(bandFor)).toEqual(["low", "low", "medium", "medium", "high", "high"]);
  });
});

describe("deriveAttritionSignals", () => {
  const now = new Date("2026-10-27T12:00:00+05:30");
  const base = (over: Partial<AttritionInput> = {}): AttritionInput => ({
    worker: { id: "w1", teamId: "t1", joinedAt: "2025-01-01T00:00:00Z" },
    shifts: [],
    teamMemberIds: new Set(["w1", "w2"]),
    teamPulses: [],
    reports: [],
    payRecords: [],
    now,
    ...over,
  });

  it("detects absences against the worker's own baseline", () => {
    // Worked every workday in the baseline window, nothing in the last 14 days.
    const baseline = dayRange("2026-09-15", "2026-10-12")
      .filter((d) => new Date(`${d}T00:00:00Z`).getUTCDay() !== 0)
      .map((d) => dayShift(d, 8));
    const s = deriveAttritionSignals(base({ shifts: baseline }));
    expect(s.absencesBaseline).toBe(0);
    expect(s.absencesRecent).toBe(12);
  });

  it("detects late pay in the window", () => {
    const s = deriveAttritionSignals(
      base({ payRecords: [{ workerId: "w1", dueDate: "2026-10-19", paidDate: "2026-10-23" }] }),
    );
    expect(s.latePay).toBe(true);
  });

  it("hides team mood below k=5 responses", () => {
    const pulses = (n: number) => Array.from({ length: n }, () => ({ teamId: "t1", weekOf: "2026-10-19", score: 1 }));
    expect(deriveAttritionSignals(base({ teamPulses: pulses(4) })).teamPulseAvg).toBeNull();
    expect(deriveAttritionSignals(base({ teamPulses: pulses(5) })).teamPulseAvg).toBe(1);
  });

  it("ignores anonymous reports entirely", () => {
    const anonymous = [
      { anonymous: true, createdAt: addDays("2026-10-26", 0) + "T05:00:00.000Z" },
      // Even a malformed anonymous report carrying a workerId must not count.
      { anonymous: true, workerId: "w2", createdAt: "2026-10-26T05:00:00.000Z" },
    ];
    const without = deriveAttritionSignals(base());
    const withAnon = deriveAttritionSignals(base({ reports: anonymous }));
    expect(withAnon).toEqual(without);
    expect(withAnon.teamSilent).toBe(true);
    expect(scoreAttrition(withAnon)).toEqual(scoreAttrition(without));
  });

  it("treats a named teammate's feedback as the team not being silent", () => {
    const s = deriveAttritionSignals(
      base({ reports: [{ anonymous: false, workerId: "w2", createdAt: "2026-10-20T05:00:00.000Z" }] }),
    );
    expect(s.teamSilent).toBe(false);
  });

  it("counts fatigue days and the longest week in the last 14 days", () => {
    const shifts = dayRange("2026-10-14", "2026-10-19").map((d) => dayShift(d, 11));
    const s = deriveAttritionSignals(base({ shifts }));
    expect(s.fatigueDays).toBeGreaterThanOrEqual(6);
    expect(s.maxWeeklyHours).toBe(66);
  });
});

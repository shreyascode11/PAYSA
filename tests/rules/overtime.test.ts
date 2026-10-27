import { describe, expect, it } from "vitest";
import {
  closeOpenShiftsAt,
  computeOvertime,
  dailyThreshold,
  otPay,
  splitShiftByDay,
} from "@/lib/rules/overtime";
import { dayShift, shift } from "../helpers";

describe("computeOvertime", () => {
  it("counts a normal 8h day as all regular", () => {
    const r = computeOvertime([shift("2026-10-05T09:00", "2026-10-05T17:00")]);
    expect(r).toMatchObject({ totalHours: 8, regularHours: 8, otHours: 0 });
  });

  it("counts hours beyond 8 in a day as daily OT", () => {
    const r = computeOvertime([shift("2026-10-05T08:00", "2026-10-05T18:30")]);
    expect(r.otHours).toBe(2.5);
    expect(r.regularHours).toBe(8);
  });

  it("sums multiple shifts on the same day before applying the daily threshold", () => {
    const r = computeOvertime([
      shift("2026-10-05T06:00", "2026-10-05T11:00"),
      shift("2026-10-05T14:00", "2026-10-05T19:00"),
    ]);
    expect(r.days).toHaveLength(1);
    expect(r.otHours).toBe(2);
  });

  it("honours a configurable 9h threshold but never above the 9h cap", () => {
    const s = [shift("2026-10-05T08:00", "2026-10-05T18:00")];
    expect(computeOvertime(s, { standardDailyHours: 9 }).otHours).toBe(1);
    expect(computeOvertime(s, { standardDailyHours: 12 }).otHours).toBe(1);
    expect(dailyThreshold(12)).toBe(9);
  });

  it("adds weekly OT beyond 48 regular hours without double-counting daily OT", () => {
    // Mon–Sat 10h/day: 2h daily OT each (12h), 48h regular -> no weekly OT on top.
    const sixTens = ["05", "06", "07", "08", "09", "10"].map((d) => dayShift(`2026-10-${d}`, 10));
    const a = computeOvertime(sixTens);
    expect(a.totalHours).toBe(60);
    expect(a.otHours).toBe(12);
    expect(a.weeks[0]?.weeklyOtHours).toBe(0);

    // Mon–Sun 8h/day: no daily OT, but 56 regular hours -> 8h weekly OT.
    const sevenEights = ["05", "06", "07", "08", "09", "10", "11"].map((d) => dayShift(`2026-10-${d}`, 8));
    const b = computeOvertime(sevenEights);
    expect(b.otHours).toBe(8);
    expect(b.regularHours).toBe(48);
    expect(b.weeks[0]).toMatchObject({ weekStart: "2026-10-05", dailyOtHours: 0, weeklyOtHours: 8 });
  });

  it("keeps Mon–Sun weeks separate", () => {
    const days = ["05", "06", "07", "08", "09", "10", "11", "12"].map((d) => dayShift(`2026-10-${d}`, 7));
    const r = computeOvertime(days);
    expect(r.weeks.map((w) => w.weekStart)).toEqual(["2026-10-05", "2026-10-12"]);
    expect(r.weeks[0]?.weeklyOtHours).toBe(1); // 49h in week one
    expect(r.otHours).toBe(1);
  });

  it("splits a shift that crosses midnight across both days", () => {
    const r = computeOvertime([shift("2026-10-05T20:00", "2026-10-06T06:00")]);
    expect(r.days).toEqual([
      { date: "2026-10-05", hours: 4, regularHours: 4, otHours: 0 },
      { date: "2026-10-06", hours: 6, regularHours: 6, otHours: 0 },
    ]);
    expect(r.otHours).toBe(0);
  });

  it("splitShiftByDay uses local (IST) midnight, not UTC", () => {
    expect(splitShiftByDay("2026-10-05T17:30:00Z", "2026-10-05T19:30:00Z")).toEqual([
      { date: "2026-10-05", hours: 1 },
      { date: "2026-10-06", hours: 1 },
    ]);
  });

  it("excludes and flags open shifts", () => {
    const open = shift("2026-10-06T08:00");
    const r = computeOvertime([shift("2026-10-05T08:00", "2026-10-05T16:00"), open]);
    expect(r.totalHours).toBe(8);
    expect(r.openShiftIds).toEqual([open.id]);
  });

  it("flags shifts that end before they start", () => {
    const bad = shift("2026-10-05T16:00", "2026-10-05T08:00");
    const r = computeOvertime([bad]);
    expect(r.totalHours).toBe(0);
    expect(r.invalidShiftIds).toEqual([bad.id]);
  });

  it("closeOpenShiftsAt ends in-progress shifts at now", () => {
    const now = new Date("2026-10-06T06:30:00Z"); // 12:00 IST
    const [closed] = closeOpenShiftsAt([shift("2026-10-06T08:00")], now);
    expect(closed?.checkOut).toBe(now.toISOString());
  });
});

describe("otPay", () => {
  it("pays OT hours at the multiplier", () => {
    expect(otPay(3, 80)).toBe(480);
    expect(otPay(3, 80, 1.5)).toBe(360);
  });
});

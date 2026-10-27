import { describe, expect, it } from "vitest";
import { buildPayslip, esiDeduction, explainPayslipTemplate } from "@/lib/rules/payslip";
import { dayShift, shift } from "../helpers";

const worker = { id: "w1", hourlyRate: 100 };
const period = { start: "2026-10-05", end: "2026-10-11" };
const week = [
  ...["05", "06", "07", "08", "09"].map((d) => dayShift(`2026-10-${d}`, 8)),
  dayShift("2026-10-10", 10),
  dayShift("2026-10-12", 8), // next period, must be excluded
];

describe("buildPayslip", () => {
  it("computes regular, OT and gross pay for the period only", () => {
    const p = buildPayslip(worker, week, period);
    expect(p).toMatchObject({
      daysWorked: 6,
      regularHours: 48,
      otHours: 2,
      regularPay: 4800,
      otPay: 400,
      grossPay: 5200,
      otMultiplier: 2,
    });
  });

  it("deducts ESI (rounded up) and advances, and nets them off", () => {
    const p = buildPayslip(worker, week, period, { advance: 500 });
    expect(p.deductions).toEqual([
      { label: "esi", amount: 39 },
      { label: "advance", amount: 500 },
    ]);
    expect(p.netPay).toBe(5200 - 39 - 500);
  });

  it("never returns negative net pay", () => {
    const p = buildPayslip(worker, [dayShift("2026-10-05", 1)], period, { advance: 5000 });
    expect(p.netPay).toBe(0);
  });

  it("reports open shifts without paying them", () => {
    const p = buildPayslip(worker, [shift("2026-10-05T08:00")], period);
    expect(p.openShifts).toBe(1);
    expect(p.grossPay).toBe(0);
  });

  it("esiDeduction rounds up to the next rupee", () => {
    expect(esiDeduction(1000)).toBe(8);
    expect(esiDeduction(0)).toBe(0);
  });
});

describe("explainPayslipTemplate", () => {
  const p = buildPayslip(worker, week, period, { advance: 500 });

  it("returns 3–5 plain sentences including the net amount", () => {
    const s = explainPayslipTemplate(p, "en");
    expect(s.length).toBeGreaterThanOrEqual(3);
    expect(s.length).toBeLessThanOrEqual(5);
    expect(s.at(-1)).toContain("₹4,661");
    expect(s.join(" ")).toContain("2 extra hours");
  });

  it("explains in Tamil and Hindi without English template text", () => {
    const ta = explainPayslipTemplate(p, "ta").join(" ");
    const hi = explainPayslipTemplate(p, "hi").join(" ");
    expect(ta).toMatch(/[஀-௿]/);
    expect(hi).toMatch(/[ऀ-ॿ]/);
    expect(ta).not.toContain("Money you get");
    expect(hi).not.toContain("Money you get");
  });

  it("mentions no overtime when there is none", () => {
    const none = buildPayslip(worker, [dayShift("2026-10-05", 8)], period);
    expect(explainPayslipTemplate(none, "en")).toContain("You did no overtime in this period.");
  });
});

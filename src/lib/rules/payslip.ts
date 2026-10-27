import { formatDay, formatHours, formatINR, t } from "../i18n";
import { DEFAULT_TZ_OFFSET_MIN, localDateKey } from "../time";
import type { Deduction, Lang, Payslip } from "../types";
import { DEFAULT_OT_MULTIPLIER, computeOvertime, otPay, type ShiftLike } from "./overtime";

export interface PayPeriod {
  /** Inclusive local day keys, "YYYY-MM-DD". */
  start: string;
  end: string;
}

export interface PayslipOptions {
  standardDailyHours?: number;
  otMultiplier?: number;
  /** Salary advances already paid out in this period. */
  advance?: number;
  tzOffsetMin?: number;
}

/** Employee share of ESI contribution. Deduction labels are locale keys under `pay.deduction`. */
export const ESI_RATE = 0.0075;

export function esiDeduction(grossPay: number): number {
  // ESI rules round contributions up to the next rupee.
  return Math.ceil(grossPay * ESI_RATE);
}

export function buildPayslip(
  worker: { id: string; hourlyRate: number },
  shifts: readonly ShiftLike[],
  period: PayPeriod,
  opts: PayslipOptions = {},
): Payslip {
  const tz = opts.tzOffsetMin ?? DEFAULT_TZ_OFFSET_MIN;
  const inPeriod = shifts.filter((s) => {
    const day = localDateKey(s.checkIn, tz);
    return day >= period.start && day <= period.end;
  });
  const ot = computeOvertime(inPeriod, { standardDailyHours: opts.standardDailyHours, tzOffsetMin: tz });
  const otMultiplier = opts.otMultiplier ?? DEFAULT_OT_MULTIPLIER;

  const regularPay = Math.round(ot.regularHours * worker.hourlyRate);
  const otAmount = otPay(ot.otHours, worker.hourlyRate, otMultiplier);
  const grossPay = regularPay + otAmount;

  const deductions: Deduction[] = [];
  const esi = esiDeduction(grossPay);
  if (esi > 0) deductions.push({ label: "esi", amount: esi });
  if (opts.advance && opts.advance > 0) deductions.push({ label: "advance", amount: Math.round(opts.advance) });
  const totalDeductions = deductions.reduce((a, d) => a + d.amount, 0);

  return {
    workerId: worker.id,
    periodStart: period.start,
    periodEnd: period.end,
    daysWorked: ot.days.length,
    regularHours: ot.regularHours,
    otHours: ot.otHours,
    hourlyRate: worker.hourlyRate,
    otMultiplier,
    regularPay,
    otPay: otAmount,
    grossPay,
    deductions,
    netPay: Math.max(0, grossPay - totalDeductions),
    openShifts: ot.openShiftIds.length,
  };
}

/** Deterministic plain-language explanation (3–5 sentences) used when AI is unavailable. */
export function explainPayslipTemplate(p: Payslip, lang: Lang): string[] {
  const tr = (key: string, vars?: Record<string, string | number>): string => t(lang, `payslip.${key}`, vars);
  const summaryVars = {
    start: formatDay(p.periodStart, lang),
    end: formatDay(p.periodEnd, lang),
    days: p.daysWorked,
    hours: formatHours(p.regularHours + p.otHours),
    count: p.openShifts,
  };
  const sentences = [
    tr(p.openShifts > 0 ? "summaryOpen" : "summary", summaryVars),
    tr("regular", { hours: formatHours(p.regularHours), rate: formatINR(p.hourlyRate), amount: formatINR(p.regularPay) }),
    p.otHours > 0
      ? tr("ot", { hours: formatHours(p.otHours), multiplier: p.otMultiplier, amount: formatINR(p.otPay) })
      : tr("noOt"),
  ];
  if (p.deductions.length > 0) {
    const items = p.deductions.map((d) => `${t(lang, `pay.deduction.${d.label}`)} ${formatINR(d.amount)}`).join(", ");
    const total = p.deductions.reduce((a, d) => a + d.amount, 0);
    sentences.push(tr("deductions", { items, amount: formatINR(total) }));
  }
  sentences.push(tr("net", { amount: formatINR(p.netPay) }));
  return sentences;
}

import "server-only";
import { explainPayslip } from "../ai/gemini";
import type { Repository } from "../repo/types";
import { assessFatigueDay, type FatigueResult } from "../rules/fatigue";
import { closeOpenShiftsAt, computeOvertime, hoursByDay } from "../rules/overtime";
import { buildPayslip } from "../rules/payslip";
import { sectorConfig } from "../sectors";
import { addDays, localDateKey, localDayStart, round2, weekStartKey } from "../time";
import type { Lang, Org, Payslip, Shift, Worker } from "../types";

export interface WorkerContext {
  worker: Worker;
  org: Org;
}

export async function loadWorker(repo: Repository, workerId: string): Promise<WorkerContext | null> {
  const worker = await repo.getWorker(workerId);
  const org = worker && (await repo.getOrg(worker.orgId));
  return worker && org ? { worker, org } : null;
}

export interface WorkerSummary {
  todayHours: number;
  weekHours: number;
  weekOtHours: number;
  openShift?: Shift;
  fatigue: FatigueResult;
}

export async function workerSummary(repo: Repository, { worker, org }: WorkerContext, now = new Date()): Promise<WorkerSummary> {
  const today = localDateKey(now);
  const weekStart = weekStartKey(today);
  // Two weeks of history: enough for rest-gap and consecutive-day checks.
  const shifts = await repo.listShifts({ workerId: worker.id, since: localDayStart(addDays(weekStart, -14)).toISOString() });
  const live = closeOpenShiftsAt(shifts, now);
  const week = computeOvertime(
    live.filter((s) => localDateKey(s.checkIn) >= weekStart),
    { standardDailyHours: sectorConfig(org.sector).standardDailyHours },
  );
  const todayFatigue = assessFatigueDay(live, today);
  const yesterday = addDays(today, -1);
  const fatigue =
    todayFatigue.level === "ok" && !live.some((s) => localDateKey(s.checkIn) === today)
      ? assessFatigueDay(live, yesterday)
      : todayFatigue;
  return {
    todayHours: round2(hoursByDay(live).get(today) ?? 0),
    weekHours: week.totalHours,
    weekOtHours: week.otHours,
    openShift: shifts.find((s) => !s.checkOut),
    fatigue,
  };
}

export interface PayslipView {
  payslip: Payslip;
  sentences: string[];
  ai: boolean;
  weekStart: string;
  hasNext: boolean;
}

export async function workerPayslip(
  repo: Repository,
  { worker, org }: WorkerContext,
  lang: Lang,
  requestedWeek: string | undefined,
  now = new Date(),
): Promise<PayslipView> {
  const thisWeek = weekStartKey(localDateKey(now));
  // Default to the last completed week; never show a future period.
  let weekStart = requestedWeek ? weekStartKey(requestedWeek) : addDays(thisWeek, -7);
  if (weekStart > thisWeek) weekStart = thisWeek;
  const period = { start: weekStart, end: addDays(weekStart, 6) };
  const [shifts, payRecords] = await Promise.all([
    repo.listShifts({ workerId: worker.id, since: localDayStart(period.start).toISOString() }),
    repo.listPayRecords([worker.id]),
  ]);
  const cfg = sectorConfig(org.sector);
  const advance = payRecords.find((p) => p.periodStart === period.start)?.advance;
  const payslip = buildPayslip(worker, shifts, period, {
    standardDailyHours: cfg.standardDailyHours,
    otMultiplier: cfg.otMultiplier,
    advance,
  });
  const { sentences, ai } = await explainPayslip(payslip, lang);
  return { payslip, sentences, ai, weekStart, hasNext: weekStart < thisWeek };
}

export async function verifiedDaysWorked(repo: Repository, workerId: string): Promise<number> {
  const shifts = await repo.listShifts({ workerId });
  return new Set(shifts.filter((s) => s.checkOut).map((s) => localDateKey(s.checkIn))).size;
}

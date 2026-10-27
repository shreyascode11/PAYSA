import "server-only";
import type { Repository } from "../repo/types";
import { canShowAggregate } from "../rules/anonymity";
import { deriveAttritionSignals, scoreAttrition, type AttritionResult } from "../rules/attrition";
import { assessFatigueDay, type FatigueResult } from "../rules/fatigue";
import { closeOpenShiftsAt, computeOvertime, hoursByDay } from "../rules/overtime";
import { sectorConfig } from "../sectors";
import { addDays, dayRange, localDateKey, localDayStart, round2, weekStartKey } from "../time";
import type { FatigueAction, Org, Report, Severity, Shift, Site, Worker } from "../types";

const HOUR = 3_600_000;

export interface OrgData {
  org: Org;
  workers: Worker[];
  sites: Site[];
  shifts: Shift[];
}

/** Everything the admin analytics need for one org, fetched in parallel once per request. */
export async function loadOrgData(repo: Repository, orgId: string, now = new Date(), days = 49): Promise<OrgData | null> {
  const org = await repo.getOrg(orgId);
  if (!org) return null;
  const since = localDayStart(addDays(localDateKey(now), -days)).toISOString();
  const [workers, sites, shifts] = await Promise.all([
    repo.listWorkers(orgId),
    repo.listSites(orgId),
    repo.listShifts({ orgId, since }),
  ]);
  return { org, workers, sites, shifts };
}

const byWorker = (shifts: Shift[]): Map<string, Shift[]> => {
  const m = new Map<string, Shift[]>();
  for (const s of shifts) m.set(s.workerId, [...(m.get(s.workerId) ?? []), s]);
  return m;
};

export interface AttritionRow {
  worker: Worker;
  result: AttritionResult;
}

export async function attritionTable(repo: Repository, data: OrgData, now = new Date()): Promise<AttritionRow[]> {
  const [pulses, reports, payRecords] = await Promise.all([
    repo.listPulses(data.org.id),
    repo.listReports(data.org.id),
    repo.listPayRecords(data.workers.map((w) => w.id)),
  ]);
  const shiftsBy = byWorker(data.shifts);
  const rows = data.workers.map((worker) => {
    const teamMemberIds = new Set(data.workers.filter((w) => w.teamId === worker.teamId).map((w) => w.id));
    const signals = deriveAttritionSignals({
      worker,
      shifts: shiftsBy.get(worker.id) ?? [],
      teamMemberIds,
      teamPulses: pulses,
      reports,
      payRecords,
      now,
    });
    return { worker, result: scoreAttrition(signals) };
  });
  return rows.sort((a, b) => b.result.score - a.result.score);
}

export interface FatigueRow {
  worker: Worker;
  cells: { date: string; hours: number; result: FatigueResult; actions: FatigueAction[] }[];
}

export async function fatigueGrid(repo: Repository, data: OrgData, now = new Date(), days = 14): Promise<{ dates: string[]; rows: FatigueRow[] }> {
  const today = localDateKey(now);
  const dates = dayRange(addDays(today, -(days - 1)), today);
  const actions = await repo.listFatigueActions(data.workers.map((w) => w.id));
  const shiftsBy = byWorker(data.shifts);
  const rows = data.workers.map((worker) => {
    const live = closeOpenShiftsAt(shiftsBy.get(worker.id) ?? [], now);
    const hours = hoursByDay(live);
    return {
      worker,
      cells: dates.map((date) => ({
        date,
        hours: round2(hours.get(date) ?? 0),
        result: assessFatigueDay(live, date),
        actions: actions.filter((a) => a.workerId === worker.id && a.date === date),
      })),
    };
  });
  return { dates, rows };
}

export interface TeamPulse {
  teamId: string;
  name: string;
  responses: number;
  /** null when below the k-anonymity threshold. */
  average: number | null;
}

export interface PersonRow {
  worker: Worker;
  onSite: boolean;
  /** Worst fatigue level in the last 7 days. */
  fatigue: FatigueResult["level"];
  risk: AttritionResult;
}

export interface WeekHoursRow {
  weekStart: string;
  regular: number;
  overtime: number;
}

/** Org-wide regular vs overtime hours per Mon–Sun week, using the same OT rules as payslips. */
export function weeklyHours(data: OrgData, now = new Date(), weeks = 6): WeekHoursRow[] {
  const thisWeek = weekStartKey(localDateKey(now));
  const starts = Array.from({ length: weeks }, (_, i) => addDays(thisWeek, -7 * (weeks - 1 - i)));
  const std = sectorConfig(data.org.sector).standardDailyHours;
  const live = closeOpenShiftsAt(data.shifts, now);
  return starts.map((weekStart) => {
    const end = addDays(weekStart, 6);
    let regular = 0;
    let overtime = 0;
    for (const w of data.workers) {
      const own = live.filter((s) => s.workerId === w.id && localDateKey(s.checkIn) >= weekStart && localDateKey(s.checkIn) <= end);
      if (own.length === 0) continue;
      const ot = computeOvertime(own, { standardDailyHours: std });
      regular += ot.regularHours;
      overtime += ot.otHours;
    }
    return { weekStart, regular: Math.round(regular), overtime: Math.round(overtime) };
  });
}

export interface Overview {
  weeks: WeekHoursRow[];
  people: PersonRow[];
  onSiteNow: number;
  workforce: number;
  attendance: { date: string; present: number; rate: number }[];
  openBySeverity: Record<Severity, number>;
  avgResolutionHours: number | null;
  fatigueCritical: number;
  highRisk: number;
  criticalReports: Report[];
  teamPulse: TeamPulse[];
}

export async function overview(repo: Repository, data: OrgData, now = new Date()): Promise<Overview> {
  const today = localDateKey(now);
  const [reports, pulses, attrition, fatigue] = await Promise.all([
    repo.listReports(data.org.id),
    repo.listPulses(data.org.id),
    attritionTable(repo, data, now),
    fatigueGrid(repo, data, now, 7),
  ]);

  // Open shifts older than 16h are forgotten checkouts, not people on site.
  const onSite = new Set(
    data.shifts.filter((s) => !s.checkOut && now.getTime() - Date.parse(s.checkIn) < 16 * HOUR).map((s) => s.workerId),
  );
  const RANK = { ok: 0, warn: 1, critical: 2 } as const;
  const people: PersonRow[] = attrition.map(({ worker, result }) => {
    const cells = fatigue.rows.find((r) => r.worker.id === worker.id)?.cells ?? [];
    const worst = cells.reduce<FatigueResult["level"]>((acc, c) => (RANK[c.result.level] > RANK[acc] ? c.result.level : acc), "ok");
    return { worker, onSite: onSite.has(worker.id), fatigue: worst, risk: result };
  });

  const attendance = dayRange(addDays(today, -13), today).map((date) => {
    const present = new Set(data.shifts.filter((s) => localDateKey(s.checkIn) === date).map((s) => s.workerId)).size;
    return { date, present, rate: data.workers.length ? Math.round((present / data.workers.length) * 100) : 0 };
  });

  const open = reports.filter((r) => r.status !== "resolved");
  const openBySeverity: Record<Severity, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const r of open) openBySeverity[r.severity] += 1;

  const resolutionHours = reports.flatMap((r) => {
    const done = r.updates.find((u) => u.status === "resolved");
    return done ? [(Date.parse(done.at) - Date.parse(r.createdAt)) / HOUR] : [];
  });

  const recentPulseStart = addDays(today, -14);
  const teamPulse = data.org.teams.map((team) => {
    const recent = pulses.filter((p) => p.teamId === team.id && p.weekOf >= recentPulseStart);
    return {
      teamId: team.id,
      name: team.name,
      responses: recent.length,
      average: canShowAggregate(recent.length) ? round2(recent.reduce((a, p) => a + p.score, 0) / recent.length) : null,
    };
  });

  return {
    weeks: weeklyHours(data, now),
    people,
    onSiteNow: onSite.size,
    workforce: data.workers.length,
    attendance,
    openBySeverity,
    avgResolutionHours: resolutionHours.length
      ? round2(resolutionHours.reduce((a, h) => a + h, 0) / resolutionHours.length)
      : null,
    fatigueCritical: fatigue.rows.filter((r) => r.cells.some((c) => c.result.level === "critical")).length,
    highRisk: attrition.filter((r) => r.result.band === "high").length,
    criticalReports: open.filter((r) => r.severity === 4).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    teamPulse,
  };
}

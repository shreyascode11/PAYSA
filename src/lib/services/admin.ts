import "server-only";
import { cache } from "react";
import type { Repository } from "../repo/types";
import { canShowAggregate } from "../rules/anonymity";
import { deriveAttritionSignals, scoreAttrition, type AttritionResult } from "../rules/attrition";
import { createFatigueAssessor, type FatigueResult } from "../rules/fatigue";
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

/**
 * Everything the admin analytics need for one org, fetched in parallel. Wrapped in React `cache` so
 * the layout, page and nested sections of one request share a single load.
 */
export const loadOrgData = cache(async (repo: Repository, orgId: string, now = new Date(), days = 49): Promise<OrgData | null> => {
  const org = await repo.getOrg(orgId);
  if (!org) return null;
  const since = localDayStart(addDays(localDateKey(now), -days)).toISOString();
  const [workers, sites, shifts] = await Promise.all([
    repo.listWorkers(orgId),
    repo.listSites(orgId),
    repo.listShifts({ orgId, since }),
  ]);
  return { org, workers, sites, shifts };
});

/** Groups items by a key in one pass. */
function groupBy<T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const bucket = m.get(k);
    if (bucket) bucket.push(item);
    else m.set(k, [item]);
  }
  return m;
}

export interface AttritionRow {
  worker: Worker;
  result: AttritionResult;
}

export const attritionTable = cache(async (repo: Repository, data: OrgData, now = new Date()): Promise<AttritionRow[]> => {
  const [pulses, reports, payRecords] = await Promise.all([
    repo.listPulses(data.org.id),
    repo.listReports(data.org.id),
    repo.listPayRecords(data.workers.map((w) => w.id)),
  ]);
  const shiftsBy = groupBy(data.shifts, (s) => s.workerId);
  const teams = new Map([...groupBy(data.workers, (w) => w.teamId)].map(([team, ws]) => [team, new Set(ws.map((w) => w.id))]));
  const rows = data.workers.map((worker) => {
    const signals = deriveAttritionSignals({
      worker,
      shifts: shiftsBy.get(worker.id) ?? [],
      teamMemberIds: teams.get(worker.teamId) ?? new Set([worker.id]),
      teamPulses: pulses,
      reports,
      payRecords,
      now,
    });
    return { worker, result: scoreAttrition(signals) };
  });
  return rows.sort((a, b) => b.result.score - a.result.score);
});

export interface FatigueRow {
  worker: Worker;
  cells: { date: string; hours: number; result: FatigueResult; actions: FatigueAction[] }[];
}

export async function fatigueGrid(repo: Repository, data: OrgData, now = new Date(), days = 14): Promise<{ dates: string[]; rows: FatigueRow[] }> {
  const today = localDateKey(now);
  const dates = dayRange(addDays(today, -(days - 1)), today);
  const actions = groupBy(await repo.listFatigueActions(data.workers.map((w) => w.id)), (a) => `${a.workerId}|${a.date}`);
  const shiftsBy = groupBy(data.shifts, (s) => s.workerId);
  const rows = data.workers.map((worker) => {
    const live = closeOpenShiftsAt(shiftsBy.get(worker.id) ?? [], now);
    const hours = hoursByDay(live);
    const assess = createFatigueAssessor(live);
    return {
      worker,
      cells: dates.map((date) => ({
        date,
        hours: round2(hours.get(date) ?? 0),
        result: assess(date),
        actions: actions.get(`${worker.id}|${date}`) ?? [],
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
  // One pass to bucket shifts by worker + week, then overtime per bucket: O(shifts), not O(weeks × workers × shifts).
  const buckets = groupBy(closeOpenShiftsAt(data.shifts, now), (s) => `${weekStartKey(localDateKey(s.checkIn))}|${s.workerId}`);
  const totals = new Map(starts.map((w) => [w, { regular: 0, overtime: 0 }]));
  for (const [key, shifts] of buckets) {
    const total = totals.get(key.slice(0, key.indexOf("|")));
    if (!total) continue;
    const ot = computeOvertime(shifts, { standardDailyHours: std });
    total.regular += ot.regularHours;
    total.overtime += ot.otHours;
  }
  return starts.map((weekStart) => {
    const t = totals.get(weekStart) ?? { regular: 0, overtime: 0 };
    return { weekStart, regular: Math.round(t.regular), overtime: Math.round(t.overtime) };
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
  const fatigueBy = new Map(fatigue.rows.map((r) => [r.worker.id, r.cells]));
  const people: PersonRow[] = attrition.map(({ worker, result }) => {
    const cells = fatigueBy.get(worker.id) ?? [];
    const worst = cells.reduce<FatigueResult["level"]>((acc, c) => (RANK[c.result.level] > RANK[acc] ? c.result.level : acc), "ok");
    return { worker, onSite: onSite.has(worker.id), fatigue: worst, risk: result };
  });

  const presentBy = new Map<string, Set<string>>();
  for (const s of data.shifts) {
    const day = localDateKey(s.checkIn);
    const set = presentBy.get(day) ?? new Set<string>();
    set.add(s.workerId);
    presentBy.set(day, set);
  }
  const attendance = dayRange(addDays(today, -13), today).map((date) => {
    const present = presentBy.get(date)?.size ?? 0;
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
  const pulsesBy = groupBy(pulses.filter((p) => p.weekOf >= recentPulseStart), (p) => p.teamId);
  const teamPulse = data.org.teams.map((team) => {
    const recent = pulsesBy.get(team.id) ?? [];
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

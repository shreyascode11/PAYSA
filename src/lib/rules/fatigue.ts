import { DEFAULT_TZ_OFFSET_MIN, addDays, hoursBetween, localDateKey, round2, weekStartKey } from "../time";
import { hoursByDay, type ShiftLike } from "./overtime";

export type FatigueLevel = "ok" | "warn" | "critical";
export type FatigueCode = "long_shift" | "short_rest" | "consecutive_days" | "weekly_hours";

export interface FatigueFactor {
  code: FatigueCode;
  level: Exclude<FatigueLevel, "ok">;
  value: number;
  limit: number;
}

export interface FatigueResult {
  level: FatigueLevel;
  reasons: string[];
  factors: FatigueFactor[];
}

export const FATIGUE_LIMITS = {
  shiftWarn: 10,
  shiftCritical: 12,
  restWarn: 11,
  restCritical: 8,
  consecutiveWarn: 6,
  weeklyWarn: 54,
  weeklyCritical: 60,
} as const;

const fmt = (n: number): string => String(round2(Math.round(n * 10) / 10));

export function describeFactor(f: FatigueFactor): string {
  switch (f.code) {
    case "long_shift":
      return `Shift of ${fmt(f.value)}h (limit ${f.limit})`;
    case "short_rest":
      return `Only ${fmt(f.value)}h rest between shifts (minimum ${f.limit})`;
    case "consecutive_days":
      return `Worked ${f.value} days in a row (limit ${f.limit})`;
    case "weekly_hours":
      return `Worked ${fmt(f.value)}h this week (limit ${f.limit})`;
  }
}

const RANK: Record<FatigueLevel, number> = { ok: 0, warn: 1, critical: 2 };

export const worseLevel = (a: FatigueLevel, b: FatigueLevel): FatigueLevel => (RANK[b] > RANK[a] ? b : a);

export type FatigueAssessor = (dateKey: string) => FatigueResult;

const OK: FatigueResult = Object.freeze({ level: "ok", reasons: [], factors: [] }) as FatigueResult;

/**
 * Precomputes everything the daily check needs (sorted shifts, per-day hours, start days) once,
 * so assessing many days for one worker is O(shifts + days) instead of re-sorting per day.
 */
export function createFatigueAssessor(shifts: readonly ShiftLike[], tzOffsetMin = DEFAULT_TZ_OFFSET_MIN): FatigueAssessor {
  const closed = shifts
    .filter((s): s is Required<ShiftLike> => !!s.checkOut && Date.parse(s.checkOut) > Date.parse(s.checkIn))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  const startedOn = new Map<string, number[]>();
  closed.forEach((s, i) => {
    const day = localDateKey(s.checkIn, tzOffsetMin);
    startedOn.set(day, [...(startedOn.get(day) ?? []), i]);
  });
  const byDay = hoursByDay(closed, tzOffsetMin);
  const L = FATIGUE_LIMITS;

  // Nearest earlier shift that had ended before shift i began (walks back past overlaps only).
  const restBefore = (i: number): number | null => {
    const s = closed[i];
    if (!s) return null;
    for (let j = i - 1; j >= 0; j--) {
      const p = closed[j];
      if (p && p.checkOut <= s.checkIn) return hoursBetween(new Date(p.checkOut), new Date(s.checkIn));
    }
    return null;
  };

  return (dateKey) => {
    const today = startedOn.get(dateKey);
    if (!today) return OK;
    const factors: FatigueFactor[] = [];

    const longest = Math.max(...today.map((i) => {
      const s = closed[i] as Required<ShiftLike>;
      return hoursBetween(new Date(s.checkIn), new Date(s.checkOut));
    }));
    if (longest > L.shiftCritical) factors.push({ code: "long_shift", level: "critical", value: longest, limit: L.shiftCritical });
    else if (longest > L.shiftWarn) factors.push({ code: "long_shift", level: "warn", value: longest, limit: L.shiftWarn });

    const rests = today.map(restBefore).filter((r): r is number => r !== null);
    const minRest = rests.length ? Math.min(...rests) : Infinity;
    if (minRest < L.restCritical) factors.push({ code: "short_rest", level: "critical", value: minRest, limit: L.restCritical });
    else if (minRest < L.restWarn) factors.push({ code: "short_rest", level: "warn", value: minRest, limit: L.restWarn });

    let streak = 0;
    for (let k = dateKey; startedOn.has(k); k = addDays(k, -1)) streak++;
    if (streak > L.consecutiveWarn) factors.push({ code: "consecutive_days", level: "warn", value: streak, limit: L.consecutiveWarn });

    let weekHours = 0;
    for (let k = weekStartKey(dateKey); k <= dateKey; k = addDays(k, 1)) weekHours += byDay.get(k) ?? 0;
    if (weekHours > L.weeklyCritical) factors.push({ code: "weekly_hours", level: "critical", value: weekHours, limit: L.weeklyCritical });
    else if (weekHours > L.weeklyWarn) factors.push({ code: "weekly_hours", level: "warn", value: weekHours, limit: L.weeklyWarn });

    const level = factors.reduce<FatigueLevel>((acc, f) => worseLevel(acc, f.level), "ok");
    return { level, factors, reasons: factors.map(describeFactor) };
  };
}

/**
 * Fatigue for one local day, judged on shifts that *started* that day. Rest days are always "ok":
 * the alert is about the work being done, not about being off.
 */
export function assessFatigueDay(shifts: readonly ShiftLike[], dateKey: string, tzOffsetMin = DEFAULT_TZ_OFFSET_MIN): FatigueResult {
  return createFatigueAssessor(shifts, tzOffsetMin)(dateKey);
}

export function assessFatigueRange(
  shifts: readonly ShiftLike[],
  dateKeys: readonly string[],
  tzOffsetMin = DEFAULT_TZ_OFFSET_MIN,
): Record<string, FatigueResult> {
  const assess = createFatigueAssessor(shifts, tzOffsetMin);
  return Object.fromEntries(dateKeys.map((k) => [k, assess(k)]));
}

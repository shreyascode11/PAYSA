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

/**
 * Fatigue for one local day, judged on shifts that *started* that day. Rest days are always "ok":
 * the alert is about the work being done, not about being off.
 */
export function assessFatigueDay(
  shifts: readonly ShiftLike[],
  dateKey: string,
  tzOffsetMin = DEFAULT_TZ_OFFSET_MIN,
): FatigueResult {
  const closed = shifts
    .filter((s): s is Required<ShiftLike> => !!s.checkOut && Date.parse(s.checkOut) > Date.parse(s.checkIn))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  const startDays = new Set(closed.map((s) => localDateKey(s.checkIn, tzOffsetMin)));
  const today = closed.filter((s) => localDateKey(s.checkIn, tzOffsetMin) === dateKey);
  if (today.length === 0) return { level: "ok", reasons: [], factors: [] };

  const factors: FatigueFactor[] = [];
  const L = FATIGUE_LIMITS;

  const longest = Math.max(...today.map((s) => hoursBetween(new Date(s.checkIn), new Date(s.checkOut))));
  if (longest > L.shiftCritical) factors.push({ code: "long_shift", level: "critical", value: longest, limit: L.shiftCritical });
  else if (longest > L.shiftWarn) factors.push({ code: "long_shift", level: "warn", value: longest, limit: L.shiftWarn });

  let minRest = Infinity;
  for (const s of today) {
    const prev = closed.filter((p) => p.checkOut <= s.checkIn).at(-1);
    if (prev) minRest = Math.min(minRest, hoursBetween(new Date(prev.checkOut), new Date(s.checkIn)));
  }
  if (minRest < L.restCritical) factors.push({ code: "short_rest", level: "critical", value: minRest, limit: L.restCritical });
  else if (minRest < L.restWarn) factors.push({ code: "short_rest", level: "warn", value: minRest, limit: L.restWarn });

  let streak = 0;
  for (let k = dateKey; startDays.has(k); k = addDays(k, -1)) streak++;
  if (streak > L.consecutiveWarn) factors.push({ code: "consecutive_days", level: "warn", value: streak, limit: L.consecutiveWarn });

  const byDay = hoursByDay(closed, tzOffsetMin);
  let weekHours = 0;
  for (let k = weekStartKey(dateKey); k <= dateKey; k = addDays(k, 1)) weekHours += byDay.get(k) ?? 0;
  if (weekHours > L.weeklyCritical) factors.push({ code: "weekly_hours", level: "critical", value: weekHours, limit: L.weeklyCritical });
  else if (weekHours > L.weeklyWarn) factors.push({ code: "weekly_hours", level: "warn", value: weekHours, limit: L.weeklyWarn });

  const level = factors.reduce<FatigueLevel>((acc, f) => worseLevel(acc, f.level), "ok");
  return { level, factors, reasons: factors.map(describeFactor) };
}

export function assessFatigueRange(
  shifts: readonly ShiftLike[],
  dateKeys: readonly string[],
  tzOffsetMin = DEFAULT_TZ_OFFSET_MIN,
): Record<string, FatigueResult> {
  return Object.fromEntries(dateKeys.map((k) => [k, assessFatigueDay(shifts, k, tzOffsetMin)]));
}

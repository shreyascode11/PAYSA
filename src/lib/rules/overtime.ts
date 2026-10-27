import { DEFAULT_TZ_OFFSET_MIN, addDays, hoursBetween, localDateKey, localDayStart, round2, weekStartKey } from "../time";

export interface ShiftLike {
  id: string;
  checkIn: string;
  checkOut?: string;
}

export interface OvertimeOptions {
  standardDailyHours?: number;
  weeklyLimitHours?: number;
  tzOffsetMin?: number;
}

/** Daily OT threshold is configurable per sector but can never exceed the statutory 9h. */
export const DAILY_HOURS_CAP = 9;
export const DEFAULT_DAILY_HOURS = 8;
export const WEEKLY_LIMIT_HOURS = 48;
export const DEFAULT_OT_MULTIPLIER = 2;

export interface DayHours {
  date: string;
  hours: number;
  regularHours: number;
  otHours: number;
}

export interface WeekHours {
  weekStart: string;
  hours: number;
  dailyOtHours: number;
  weeklyOtHours: number;
}

export interface OvertimeResult {
  days: DayHours[];
  weeks: WeekHours[];
  totalHours: number;
  regularHours: number;
  otHours: number;
  /** Shifts with no checkout: excluded from totals until closed. */
  openShiftIds: string[];
  /** Shifts whose checkout is not after check-in. */
  invalidShiftIds: string[];
}

export const dailyThreshold = (standardDailyHours = DEFAULT_DAILY_HOURS): number =>
  Math.min(standardDailyHours, DAILY_HOURS_CAP);

/** Split one closed shift into per-local-day hour chunks so midnight-crossing shifts land on both days. */
export function splitShiftByDay(
  checkIn: string,
  checkOut: string,
  tzOffsetMin = DEFAULT_TZ_OFFSET_MIN,
): { date: string; hours: number }[] {
  const end = new Date(checkOut);
  let cursor = new Date(checkIn);
  const parts: { date: string; hours: number }[] = [];
  while (cursor < end) {
    const date = localDateKey(cursor, tzOffsetMin);
    const nextMidnight = localDayStart(addDays(date, 1), tzOffsetMin);
    const sliceEnd = nextMidnight < end ? nextMidnight : end;
    parts.push({ date, hours: hoursBetween(cursor, sliceEnd) });
    cursor = sliceEnd;
  }
  return parts;
}

/** Sum of worked hours per local day, open/invalid shifts ignored. */
export function hoursByDay(shifts: readonly ShiftLike[], tzOffsetMin = DEFAULT_TZ_OFFSET_MIN): Map<string, number> {
  const byDay = new Map<string, number>();
  for (const s of shifts) {
    if (!s.checkOut || Date.parse(s.checkOut) <= Date.parse(s.checkIn)) continue;
    for (const p of splitShiftByDay(s.checkIn, s.checkOut, tzOffsetMin)) {
      byDay.set(p.date, (byDay.get(p.date) ?? 0) + p.hours);
    }
  }
  return byDay;
}

export function computeOvertime(shifts: readonly ShiftLike[], opts: OvertimeOptions = {}): OvertimeResult {
  const threshold = dailyThreshold(opts.standardDailyHours);
  const weeklyLimit = opts.weeklyLimitHours ?? WEEKLY_LIMIT_HOURS;
  const tz = opts.tzOffsetMin ?? DEFAULT_TZ_OFFSET_MIN;

  const openShiftIds = shifts.filter((s) => !s.checkOut).map((s) => s.id);
  const invalidShiftIds = shifts
    .filter((s) => s.checkOut && Date.parse(s.checkOut) <= Date.parse(s.checkIn))
    .map((s) => s.id);

  const days: DayHours[] = [...hoursByDay(shifts, tz).entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, hours]) => ({
      date,
      hours: round2(hours),
      regularHours: round2(Math.min(hours, threshold)),
      otHours: round2(Math.max(0, hours - threshold)),
    }));

  const weekMap = new Map<string, { regular: number; dailyOt: number; hours: number }>();
  for (const d of days) {
    const key = weekStartKey(d.date);
    const w = weekMap.get(key) ?? { regular: 0, dailyOt: 0, hours: 0 };
    w.regular += d.regularHours;
    w.dailyOt += d.otHours;
    w.hours += d.hours;
    weekMap.set(key, w);
  }

  // Weekly OT only counts *regular* hours past the limit, so hours already paid as daily OT aren't paid twice.
  const weeks: WeekHours[] = [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, w]) => ({
      weekStart,
      hours: round2(w.hours),
      dailyOtHours: round2(w.dailyOt),
      weeklyOtHours: round2(Math.max(0, w.regular - weeklyLimit)),
    }));

  const totalHours = round2(days.reduce((a, d) => a + d.hours, 0));
  const otHours = round2(weeks.reduce((a, w) => a + w.dailyOtHours + w.weeklyOtHours, 0));
  return {
    days,
    weeks,
    totalHours,
    otHours,
    regularHours: round2(totalHours - otHours),
    openShiftIds,
    invalidShiftIds,
  };
}

export function otPay(otHours: number, hourlyRate: number, otMultiplier = DEFAULT_OT_MULTIPLIER): number {
  return Math.round(otHours * hourlyRate * otMultiplier);
}

/** Treat in-progress shifts as ending now, for live "hours so far" and fatigue views. */
export function closeOpenShiftsAt<T extends ShiftLike>(shifts: readonly T[], now: Date): T[] {
  return shifts.map((s) => (s.checkOut ? s : { ...s, checkOut: now.toISOString() }));
}

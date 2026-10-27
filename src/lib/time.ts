/** All org-local day maths uses a fixed offset; India (IST, +05:30) has no DST. */
export const DEFAULT_TZ_OFFSET_MIN = 330;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

export const hoursBetween = (start: Date, end: Date): number => (end.getTime() - start.getTime()) / MS_PER_HOUR;

export const round2 = (n: number): number => Math.round(n * 100) / 100;

/** "YYYY-MM-DD" for the org-local calendar day containing `d`. */
export function localDateKey(d: Date | string, tzOffsetMin = DEFAULT_TZ_OFFSET_MIN): string {
  const t = new Date(d).getTime() + tzOffsetMin * 60_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** UTC instant at which the org-local day `key` starts. */
export function localDayStart(key: string, tzOffsetMin = DEFAULT_TZ_OFFSET_MIN): Date {
  return new Date(Date.parse(`${key}T00:00:00Z`) - tzOffsetMin * 60_000);
}

export function addDays(key: string, days: number): string {
  return new Date(Date.parse(`${key}T00:00:00Z`) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Monday of the Mon–Sun week containing the day `key`. */
export function weekStartKey(key: string): string {
  const dow = new Date(`${key}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(key, -((dow + 6) % 7));
}

export function daysBetweenKeys(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY);
}

/** Inclusive list of day keys from `from` to `to`. */
export function dayRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let k = from; k <= to; k = addDays(k, 1)) out.push(k);
  return out;
}

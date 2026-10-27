import type { Shift } from "@/lib/types";

let n = 0;
/** Shift in IST using "YYYY-MM-DDTHH:mm" local times. */
export function shift(checkIn: string, checkOut?: string, workerId = "w1"): Shift {
  n += 1;
  return {
    id: `s${n}`,
    workerId,
    siteId: "site1",
    checkIn: new Date(`${checkIn}:00+05:30`).toISOString(),
    checkOut: checkOut ? new Date(`${checkOut}:00+05:30`).toISOString() : undefined,
    method: "qr",
  };
}

/** Same-day shift of `hours` starting at 08:00 local on `day`. */
export function dayShift(day: string, hours: number, workerId = "w1"): Shift {
  const start = new Date(`${day}T08:00:00+05:30`);
  const end = new Date(start.getTime() + hours * 3_600_000);
  return { ...shift(`${day}T08:00`, undefined, workerId), checkOut: end.toISOString() };
}

import { DEFAULT_TZ_OFFSET_MIN, addDays, dayRange, daysBetweenKeys, localDateKey } from "../time";
import { canShowAggregate } from "./anonymity";
import { createFatigueAssessor } from "./fatigue";
import { hoursByDay, type ShiftLike } from "./overtime";

export type DriverCode =
  | "absences_up"
  | "fatigue_days"
  | "long_weeks"
  | "late_pay"
  | "low_team_mood"
  | "new_joiner"
  | "team_silent";

export type ActionCode = "one_on_one" | "reduce_hours" | "check_pay" | "team_meeting" | "buddy_checkin";

export interface AttritionSignals {
  absencesRecent: number;
  /** Worker's own usual absences, scaled to a 14-day window. */
  absencesBaseline: number;
  fatigueDays: number;
  maxWeeklyHours: number;
  latePay: boolean;
  /** null when fewer than k pulses exist, so a tiny team's mood can't be inferred. */
  teamPulseAvg: number | null;
  tenureDays: number;
  teamSilent: boolean;
}

export interface Driver {
  code: DriverCode;
  points: number;
  detail: string;
  action: ActionCode;
}

export type RiskBand = "low" | "medium" | "high";

export interface AttritionResult {
  score: number;
  band: RiskBand;
  drivers: Driver[];
}

export const ATTRITION_POINTS = {
  absencesUp: 20,
  fatiguePerDay: 5,
  fatigueMax: 20,
  longWeeks: 15,
  latePay: 20,
  lowTeamMood: 10,
  newJoiner: 10,
  teamSilent: 5,
} as const;

export function bandFor(score: number): RiskBand {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

const one = (n: number): string => (Math.round(n * 10) / 10).toString();

export function scoreAttrition(s: AttritionSignals): AttritionResult {
  const P = ATTRITION_POINTS;
  const drivers: Driver[] = [];
  const absenceDelta = s.absencesRecent - s.absencesBaseline;
  if (absenceDelta >= 2) {
    drivers.push({
      code: "absences_up",
      points: P.absencesUp,
      detail: `${s.absencesRecent} absences in 14 days (usual ${one(s.absencesBaseline)})`,
      action: "one_on_one",
    });
  }
  if (s.fatigueDays > 0) {
    drivers.push({
      code: "fatigue_days",
      points: Math.min(P.fatigueMax, s.fatigueDays * P.fatiguePerDay),
      detail: `${s.fatigueDays} fatigue-alert days in 14 days`,
      action: "reduce_hours",
    });
  }
  if (s.maxWeeklyHours > 54) {
    drivers.push({
      code: "long_weeks",
      points: P.longWeeks,
      detail: `Worked ${one(s.maxWeeklyHours)}h in a week (over 54)`,
      action: "reduce_hours",
    });
  }
  if (s.latePay) {
    drivers.push({ code: "late_pay", points: P.latePay, detail: "Pay was late or missed this period", action: "check_pay" });
  }
  if (s.teamPulseAvg !== null && s.teamPulseAvg <= 2) {
    drivers.push({
      code: "low_team_mood",
      points: P.lowTeamMood,
      detail: `Team mood is low (avg ${one(s.teamPulseAvg)}/5)`,
      action: "team_meeting",
    });
  }
  if (s.tenureDays < 90) {
    drivers.push({ code: "new_joiner", points: P.newJoiner, detail: `Joined ${s.tenureDays} days ago`, action: "buddy_checkin" });
  }
  if (s.teamSilent) {
    drivers.push({ code: "team_silent", points: P.teamSilent, detail: "No team pulse or feedback in 3 weeks", action: "team_meeting" });
  }
  drivers.sort((a, b) => b.points - a.points);
  const score = Math.min(100, drivers.reduce((a, d) => a + d.points, 0));
  return { score, band: bandFor(score), drivers };
}

export interface AttritionInput {
  worker: { id: string; teamId: string; joinedAt: string };
  shifts: readonly ShiftLike[];
  teamMemberIds: ReadonlySet<string>;
  teamPulses: readonly { teamId: string; weekOf: string; score: number }[];
  /** Any reports may be passed; anonymous ones are discarded here and never reach the score. */
  reports: readonly { anonymous: boolean; workerId?: string; createdAt: string }[];
  payRecords: readonly { workerId: string; dueDate: string; paidDate?: string }[];
  now: Date;
  tzOffsetMin?: number;
}

// Both sectors schedule six working days; Sunday is the weekly off.
const isWorkday = (key: string): boolean => new Date(`${key}T00:00:00Z`).getUTCDay() !== 0;

export function deriveAttritionSignals(input: AttritionInput): AttritionSignals {
  const tz = input.tzOffsetMin ?? DEFAULT_TZ_OFFSET_MIN;
  const today = localDateKey(input.now, tz);
  const joined = localDateKey(input.worker.joinedAt, tz);
  const worked = new Set(
    input.shifts.filter((s) => s.checkOut).map((s) => localDateKey(s.checkIn, tz)),
  );

  const eligible = (from: string, to: string): string[] =>
    dayRange(from, to).filter((k) => k >= joined && isWorkday(k));
  const recentDays = eligible(addDays(today, -14), addDays(today, -1));
  const baselineDays = eligible(addDays(today, -42), addDays(today, -15));
  const absencesRecent = recentDays.filter((k) => !worked.has(k)).length;
  const baselineAbs = baselineDays.filter((k) => !worked.has(k)).length;
  const absencesBaseline =
    baselineDays.length > 0 ? (baselineAbs / baselineDays.length) * recentDays.length : absencesRecent;

  const last14 = dayRange(addDays(today, -13), today);
  const assess = createFatigueAssessor(input.shifts, tz);
  const fatigueDays = last14.filter((k) => assess(k).level !== "ok").length;

  const byDay = hoursByDay(input.shifts, tz);
  const sumDays = (keys: string[]): number => keys.reduce((a, k) => a + (byDay.get(k) ?? 0), 0);
  const maxWeeklyHours = Math.max(sumDays(last14.slice(0, 7)), sumDays(last14.slice(7)));

  const windowStart = addDays(today, -14);
  const latePay = input.payRecords.some((p) => {
    if (p.workerId !== input.worker.id) return false;
    const due = localDateKey(p.dueDate, tz);
    if (due < windowStart || due > today) return false;
    return p.paidDate ? localDateKey(p.paidDate, tz) > due : due < today;
  });

  const recentPulses = input.teamPulses.filter(
    (p) => p.teamId === input.worker.teamId && p.weekOf >= windowStart,
  );
  const teamPulseAvg = canShowAggregate(recentPulses.length)
    ? recentPulses.reduce((a, p) => a + p.score, 0) / recentPulses.length
    : null;

  const silenceStart = addDays(today, -21);
  const teamPulsed = input.teamPulses.some((p) => p.teamId === input.worker.teamId && p.weekOf >= silenceStart);
  const teamSpoke = input.reports.some(
    (r) =>
      !r.anonymous &&
      r.workerId !== undefined &&
      input.teamMemberIds.has(r.workerId) &&
      localDateKey(r.createdAt, tz) >= silenceStart,
  );

  return {
    absencesRecent,
    absencesBaseline,
    fatigueDays,
    maxWeeklyHours,
    latePay,
    teamPulseAvg,
    tenureDays: Math.max(0, daysBetweenKeys(joined, today)),
    teamSilent: !teamPulsed && !teamSpoke,
  };
}

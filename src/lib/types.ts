export type Sector = "construction" | "college";
export type Lang = "en" | "ta" | "hi";
export const LANGS: readonly Lang[] = ["en", "ta", "hi"] as const;

export interface Team {
  id: string;
  name: string;
}

export interface Org {
  id: string;
  name: string;
  sector: Sector;
  teams: Team[];
}

export interface Site {
  id: string;
  orgId: string;
  name: string;
  lat: number;
  lng: number;
  radiusM: number;
}

export interface Worker {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  pinHash: string;
  lang: Lang;
  role: string;
  dailyWage: number;
  hourlyRate: number;
  teamId: string;
  joinedAt: string;
  passportId: string;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  orgIds: string[];
}

export type CheckInMethod = "qr" | "geo" | "manual";

export interface Shift {
  id: string;
  workerId: string;
  siteId: string;
  checkIn: string;
  checkOut?: string;
  method: CheckInMethod;
}

export interface Deduction {
  label: string;
  amount: number;
}

export interface Payslip {
  workerId: string;
  periodStart: string;
  periodEnd: string;
  daysWorked: number;
  regularHours: number;
  otHours: number;
  hourlyRate: number;
  otMultiplier: number;
  regularPay: number;
  otPay: number;
  grossPay: number;
  deductions: Deduction[];
  netPay: number;
  openShifts: number;
}

/** Records when a pay period was due and actually paid; drives the late-pay attrition signal. */
export interface PayRecord {
  workerId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  paidDate?: string;
  advance?: number;
}

export type ReportType = "hazard" | "grievance" | "manager_feedback";
export type ReportStatus = "received" | "in_review" | "action_taken" | "resolved";
export const REPORT_STATUSES: readonly ReportStatus[] = ["received", "in_review", "action_taken", "resolved"];
export type Severity = 1 | 2 | 3 | 4;

export interface ReportUpdate {
  at: string;
  status: ReportStatus;
  note: string;
}

export interface ReportMessage {
  from: "worker" | "admin";
  text: string;
  at: string;
}

export interface Report {
  id: string;
  trackingId: string;
  orgId: string;
  siteId?: string;
  type: ReportType;
  category: string;
  severity: Severity;
  textOriginal: string;
  langOriginal: Lang;
  textEn: string;
  photoUrl?: string;
  status: ReportStatus;
  anonymous: boolean;
  /** Present ONLY when anonymous === false. */
  workerId?: string;
  createdAt: string;
  updates: ReportUpdate[];
  messages: ReportMessage[];
}

export interface Pulse {
  id: string;
  orgId: string;
  teamId: string;
  weekOf: string;
  score: 1 | 2 | 3 | 4 | 5;
}

export type SkillSource = "training" | "experience" | "employer";

export interface SkillEntry {
  id: string;
  workerId: string;
  skill: string;
  level: 1 | 2 | 3;
  source: SkillSource;
  endorsedBy?: string;
  date: string;
}

export interface FatigueAction {
  id: string;
  workerId: string;
  date: string;
  action: string;
  at: string;
}

export interface Announcement {
  id: string;
  orgId: string;
  text: string;
  /** Language the notice was written in, so it is read aloud with the right voice. */
  lang: Lang;
  createdAt: string;
}

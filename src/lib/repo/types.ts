import type {
  Admin,
  Announcement,
  FatigueAction,
  Org,
  PayRecord,
  Pulse,
  Report,
  Shift,
  Site,
  SkillEntry,
  Worker,
} from "../types";

export interface ShiftQuery {
  workerId?: string;
  orgId?: string;
  /** Only shifts that checked in at or after this ISO instant. */
  since?: string;
}

/** Storage boundary. Routes and pages talk only to this, never to Firestore or memory directly. */
export interface Repository {
  listOrgs(): Promise<Org[]>;
  getOrg(id: string): Promise<Org | undefined>;

  listSites(orgId: string): Promise<Site[]>;
  getSite(id: string): Promise<Site | undefined>;

  listWorkers(orgId: string): Promise<Worker[]>;
  getWorker(id: string): Promise<Worker | undefined>;
  findWorkerByPhone(phone: string): Promise<Worker | undefined>;
  findWorkerByPassport(passportId: string): Promise<Worker | undefined>;

  findAdminByEmail(email: string): Promise<Admin | undefined>;
  getAdmin(id: string): Promise<Admin | undefined>;

  listShifts(q: ShiftQuery): Promise<Shift[]>;
  getOpenShift(workerId: string): Promise<Shift | undefined>;
  addShift(shift: Shift): Promise<void>;
  closeShift(id: string, checkOut: string): Promise<Shift | undefined>;

  listReports(orgId: string): Promise<Report[]>;
  getReport(id: string): Promise<Report | undefined>;
  findReportByTracking(trackingId: string): Promise<Report | undefined>;
  addReport(report: Report): Promise<void>;
  saveReport(report: Report): Promise<void>;

  listPulses(orgId: string): Promise<Pulse[]>;
  addPulse(pulse: Pulse): Promise<void>;

  listSkills(workerId: string): Promise<SkillEntry[]>;
  saveSkill(skill: SkillEntry): Promise<void>;

  listPayRecords(workerIds: readonly string[]): Promise<PayRecord[]>;

  listFatigueActions(workerIds: readonly string[]): Promise<FatigueAction[]>;
  addFatigueAction(action: FatigueAction): Promise<void>;

  listAnnouncements(orgId: string): Promise<Announcement[]>;
  addAnnouncement(a: Announcement): Promise<void>;
}

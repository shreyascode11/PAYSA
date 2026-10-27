import type { SeedData } from "@/data/seed";
import type { Announcement, FatigueAction, Pulse, Report, Shift, SkillEntry } from "../types";
import type { Repository, ShiftQuery } from "./types";

/** Recursively freezes a value so shared references can never be mutated by callers. */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}

/** Records are copied and frozen once on write, so reads can hand out references without copying. */
const store = <T>(v: T): T => deepFreeze(structuredClone(v));

/** Zero-config store for local runs and demos. Data resets when the process restarts. */
export class MemoryRepository implements Repository {
  private readonly db: SeedData;

  constructor(seed: SeedData) {
    // Top-level arrays stay mutable (we append/replace); every record inside is frozen.
    this.db = Object.fromEntries(Object.entries(seed).map(([k, rows]) => [k, (rows as unknown[]).map(store)])) as unknown as SeedData;
  }

  async listOrgs() {
    return [...this.db.orgs];
  }
  async getOrg(id: string) {
    return this.db.orgs.find((o) => o.id === id);
  }

  async listSites(orgId: string) {
    return this.db.sites.filter((s) => s.orgId === orgId);
  }
  async getSite(id: string) {
    return this.db.sites.find((s) => s.id === id);
  }

  async listWorkers(orgId: string) {
    return this.db.workers.filter((w) => w.orgId === orgId);
  }
  async getWorker(id: string) {
    return this.db.workers.find((w) => w.id === id);
  }
  async findWorkerByPhone(phone: string) {
    return this.db.workers.find((w) => w.phone === phone);
  }
  async findWorkerByPassport(passportId: string) {
    return this.db.workers.find((w) => w.passportId === passportId);
  }

  async findAdminByEmail(email: string) {
    const e = email.trim().toLowerCase();
    return this.db.admins.find((a) => a.email === e);
  }
  async getAdmin(id: string) {
    return this.db.admins.find((a) => a.id === id);
  }

  async listShifts(q: ShiftQuery) {
    const orgWorkers = q.orgId ? new Set(this.db.workers.filter((w) => w.orgId === q.orgId).map((w) => w.id)) : null;
    const since = q.since ?? "";
    // ISO-8601 UTC strings sort lexically, so no Date parsing is needed per row.
    return this.db.shifts.filter(
      (s) => (!q.workerId || s.workerId === q.workerId) && (!orgWorkers || orgWorkers.has(s.workerId)) && s.checkIn >= since,
    );
  }
  async getOpenShift(workerId: string) {
    return this.db.shifts.find((s) => s.workerId === workerId && !s.checkOut);
  }
  async addShift(shift: Shift) {
    this.db.shifts.push(store(shift));
  }
  async closeShift(id: string, checkOut: string) {
    const i = this.db.shifts.findIndex((x) => x.id === id);
    const s = this.db.shifts[i];
    if (!s || s.checkOut) return undefined;
    const closed = store({ ...s, checkOut });
    this.db.shifts[i] = closed;
    return closed;
  }

  async listReports(orgId: string) {
    return this.db.reports.filter((r) => r.orgId === orgId);
  }
  async getReport(id: string) {
    return this.db.reports.find((r) => r.id === id);
  }
  async findReportByTracking(trackingId: string) {
    return this.db.reports.find((r) => r.trackingId === trackingId);
  }
  async addReport(report: Report) {
    this.db.reports.push(store(report));
  }
  async saveReport(report: Report) {
    const i = this.db.reports.findIndex((r) => r.id === report.id);
    if (i >= 0) this.db.reports[i] = store(report);
  }

  async listPulses(orgId: string) {
    return this.db.pulses.filter((p) => p.orgId === orgId);
  }
  async addPulse(pulse: Pulse) {
    this.db.pulses.push(store(pulse));
  }

  async listSkills(workerId: string) {
    return this.db.skills.filter((s) => s.workerId === workerId);
  }
  async saveSkill(skill: SkillEntry) {
    const i = this.db.skills.findIndex((s) => s.id === skill.id);
    if (i >= 0) this.db.skills[i] = store(skill);
    else this.db.skills.push(store(skill));
  }

  async listPayRecords(workerIds: readonly string[]) {
    const ids = new Set(workerIds);
    return this.db.payRecords.filter((p) => ids.has(p.workerId));
  }

  async listFatigueActions(workerIds: readonly string[]) {
    const ids = new Set(workerIds);
    return this.db.fatigueActions.filter((a) => ids.has(a.workerId));
  }
  async addFatigueAction(action: FatigueAction) {
    this.db.fatigueActions.push(store(action));
  }

  async listAnnouncements(orgId: string) {
    return this.db.announcements.filter((a) => a.orgId === orgId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async addAnnouncement(a: Announcement) {
    this.db.announcements.push(store(a));
  }
}

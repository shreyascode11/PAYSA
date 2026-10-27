import type { SeedData } from "@/data/seed";
import type { Announcement, FatigueAction, Pulse, Report, Shift, SkillEntry } from "../types";
import type { Repository, ShiftQuery } from "./types";

const copy = <T>(v: T): T => structuredClone(v);

/** Zero-config store for local runs and demos. Data resets when the process restarts. */
export class MemoryRepository implements Repository {
  constructor(private readonly db: SeedData) {}

  async listOrgs() {
    return copy(this.db.orgs);
  }
  async getOrg(id: string) {
    return copy(this.db.orgs.find((o) => o.id === id));
  }

  async listSites(orgId: string) {
    return copy(this.db.sites.filter((s) => s.orgId === orgId));
  }
  async getSite(id: string) {
    return copy(this.db.sites.find((s) => s.id === id));
  }

  async listWorkers(orgId: string) {
    return copy(this.db.workers.filter((w) => w.orgId === orgId));
  }
  async getWorker(id: string) {
    return copy(this.db.workers.find((w) => w.id === id));
  }
  async findWorkerByPhone(phone: string) {
    return copy(this.db.workers.find((w) => w.phone === phone));
  }
  async findWorkerByPassport(passportId: string) {
    return copy(this.db.workers.find((w) => w.passportId === passportId));
  }

  async findAdminByEmail(email: string) {
    const e = email.trim().toLowerCase();
    return copy(this.db.admins.find((a) => a.email === e));
  }
  async getAdmin(id: string) {
    return copy(this.db.admins.find((a) => a.id === id));
  }

  async listShifts(q: ShiftQuery) {
    const orgWorkers = q.orgId ? new Set(this.db.workers.filter((w) => w.orgId === q.orgId).map((w) => w.id)) : null;
    const since = q.since ? Date.parse(q.since) : -Infinity;
    return copy(
      this.db.shifts.filter(
        (s) =>
          (!q.workerId || s.workerId === q.workerId) &&
          (!orgWorkers || orgWorkers.has(s.workerId)) &&
          Date.parse(s.checkIn) >= since,
      ),
    );
  }
  async getOpenShift(workerId: string) {
    return copy(this.db.shifts.find((s) => s.workerId === workerId && !s.checkOut));
  }
  async addShift(shift: Shift) {
    this.db.shifts.push(copy(shift));
  }
  async closeShift(id: string, checkOut: string) {
    const s = this.db.shifts.find((x) => x.id === id);
    if (!s || s.checkOut) return undefined;
    s.checkOut = checkOut;
    return copy(s);
  }

  async listReports(orgId: string) {
    return copy(this.db.reports.filter((r) => r.orgId === orgId));
  }
  async getReport(id: string) {
    return copy(this.db.reports.find((r) => r.id === id));
  }
  async findReportByTracking(trackingId: string) {
    return copy(this.db.reports.find((r) => r.trackingId === trackingId));
  }
  async addReport(report: Report) {
    this.db.reports.push(copy(report));
  }
  async saveReport(report: Report) {
    const i = this.db.reports.findIndex((r) => r.id === report.id);
    if (i >= 0) this.db.reports[i] = copy(report);
  }

  async listPulses(orgId: string) {
    return copy(this.db.pulses.filter((p) => p.orgId === orgId));
  }
  async addPulse(pulse: Pulse) {
    this.db.pulses.push(copy(pulse));
  }

  async listSkills(workerId: string) {
    return copy(this.db.skills.filter((s) => s.workerId === workerId));
  }
  async saveSkill(skill: SkillEntry) {
    const i = this.db.skills.findIndex((s) => s.id === skill.id);
    if (i >= 0) this.db.skills[i] = copy(skill);
    else this.db.skills.push(copy(skill));
  }

  async listPayRecords(workerIds: readonly string[]) {
    const ids = new Set(workerIds);
    return copy(this.db.payRecords.filter((p) => ids.has(p.workerId)));
  }

  async listFatigueActions(workerIds: readonly string[]) {
    const ids = new Set(workerIds);
    return copy(this.db.fatigueActions.filter((a) => ids.has(a.workerId)));
  }
  async addFatigueAction(action: FatigueAction) {
    this.db.fatigueActions.push(copy(action));
  }

  async listAnnouncements(orgId: string) {
    return copy(
      this.db.announcements.filter((a) => a.orgId === orgId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }
  async addAnnouncement(a: Announcement) {
    this.db.announcements.push(copy(a));
  }
}

import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import type { SeedData } from "@/data/seed";
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
import type { Repository, ShiftQuery } from "./types";

const C = {
  orgs: "orgs",
  sites: "sites",
  workers: "workers",
  admins: "admins",
  shifts: "shifts",
  reports: "reports",
  pulses: "pulses",
  skills: "skills",
  payRecords: "payRecords",
  fatigueActions: "fatigueActions",
  announcements: "announcements",
  meta: "meta",
} as const;

const payRecordId = (p: PayRecord): string => `${p.workerId}_${p.periodStart}`;
const BATCH_LIMIT = 450;

/**
 * Durable store for Cloud Run. Queries stay on single fields so no composite indexes are needed;
 * narrower filters run in memory, which is fine at one-site/one-campus scale.
 */
export class FirestoreRepository implements Repository {
  private ready: Promise<Firestore> | null = null;

  constructor(
    private readonly projectId: string,
    private readonly seed: () => SeedData,
  ) {}

  private db(): Promise<Firestore> {
    this.ready ??= this.init();
    return this.ready;
  }

  private async init(): Promise<Firestore> {
    const { initializeApp, getApps, applicationDefault, cert } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");
    // Cloud Run has ambient Google credentials; elsewhere (e.g. Vercel) pass a service-account JSON via env.
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    const credential = serviceAccount ? cert(JSON.parse(serviceAccount) as object) : applicationDefault();
    const app = getApps()[0] ?? initializeApp({ credential, projectId: this.projectId });
    const db = getFirestore(app);
    db.settings({ ignoreUndefinedProperties: true });
    await this.seedIfEmpty(db);
    return db;
  }

  /** First boot against an empty project writes the demo data once; `create` makes this race-safe. */
  private async seedIfEmpty(db: Firestore): Promise<void> {
    try {
      await db.collection(C.meta).doc("seed").create({ at: new Date().toISOString() });
    } catch {
      return; // already seeded by this or another instance
    }
    const s = this.seed();
    const writes: [string, string, object][] = [
      ...s.orgs.map((x) => [C.orgs, x.id, x] as [string, string, object]),
      ...s.sites.map((x) => [C.sites, x.id, x] as [string, string, object]),
      ...s.workers.map((x) => [C.workers, x.id, x] as [string, string, object]),
      ...s.admins.map((x) => [C.admins, x.id, x] as [string, string, object]),
      ...s.shifts.map((x) => [C.shifts, x.id, x] as [string, string, object]),
      ...s.reports.map((x) => [C.reports, x.id, x] as [string, string, object]),
      ...s.pulses.map((x) => [C.pulses, x.id, x] as [string, string, object]),
      ...s.skills.map((x) => [C.skills, x.id, x] as [string, string, object]),
      ...s.payRecords.map((x) => [C.payRecords, payRecordId(x), x] as [string, string, object]),
      ...s.announcements.map((x) => [C.announcements, x.id, x] as [string, string, object]),
    ];
    for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
      const batch = db.batch();
      for (const [col, id, data] of writes.slice(i, i + BATCH_LIMIT)) batch.set(db.collection(col).doc(id), data);
      await batch.commit();
    }
  }

  private async all<T>(col: string): Promise<T[]> {
    const snap = await (await this.db()).collection(col).get();
    return snap.docs.map((d) => d.data() as T);
  }

  private async where<T>(col: string, field: string, value: string): Promise<T[]> {
    const snap = await (await this.db()).collection(col).where(field, "==", value).get();
    return snap.docs.map((d) => d.data() as T);
  }

  private async get<T>(col: string, id: string): Promise<T | undefined> {
    if (!id) return undefined;
    const doc = await (await this.db()).collection(col).doc(id).get();
    return doc.exists ? (doc.data() as T) : undefined;
  }

  private async put(col: string, id: string, data: object): Promise<void> {
    await (await this.db()).collection(col).doc(id).set(data);
  }

  private async first<T>(col: string, field: string, value: string): Promise<T | undefined> {
    return (await this.where<T>(col, field, value))[0];
  }

  listOrgs = () => this.all<Org>(C.orgs);
  getOrg = (id: string) => this.get<Org>(C.orgs, id);

  listSites = (orgId: string) => this.where<Site>(C.sites, "orgId", orgId);
  getSite = (id: string) => this.get<Site>(C.sites, id);

  listWorkers = (orgId: string) => this.where<Worker>(C.workers, "orgId", orgId);
  getWorker = (id: string) => this.get<Worker>(C.workers, id);
  findWorkerByPhone = (phone: string) => this.first<Worker>(C.workers, "phone", phone);
  findWorkerByPassport = (passportId: string) => this.first<Worker>(C.workers, "passportId", passportId);

  findAdminByEmail = (email: string) => this.first<Admin>(C.admins, "email", email.trim().toLowerCase());
  getAdmin = (id: string) => this.get<Admin>(C.admins, id);

  async listShifts(q: ShiftQuery): Promise<Shift[]> {
    let shifts: Shift[];
    if (q.workerId) {
      shifts = await this.where<Shift>(C.shifts, "workerId", q.workerId);
    } else if (q.since) {
      const snap = await (await this.db()).collection(C.shifts).where("checkIn", ">=", q.since).get();
      shifts = snap.docs.map((d) => d.data() as Shift);
    } else {
      shifts = await this.all<Shift>(C.shifts);
    }
    const orgWorkers = q.orgId ? new Set((await this.listWorkers(q.orgId)).map((w) => w.id)) : null;
    return shifts.filter((s) => (!orgWorkers || orgWorkers.has(s.workerId)) && (!q.since || s.checkIn >= q.since));
  }
  async getOpenShift(workerId: string) {
    return (await this.where<Shift>(C.shifts, "workerId", workerId)).find((s) => !s.checkOut);
  }
  addShift = (shift: Shift) => this.put(C.shifts, shift.id, shift);
  async closeShift(id: string, checkOut: string): Promise<Shift | undefined> {
    const db = await this.db();
    const ref = db.collection(C.shifts).doc(id);
    // Transaction so a double-tapped "End work" can't close the same shift twice.
    return db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      const s = doc.data() as Shift | undefined;
      if (!s || s.checkOut) return undefined;
      tx.update(ref, { checkOut });
      return { ...s, checkOut };
    });
  }

  listReports = (orgId: string) => this.where<Report>(C.reports, "orgId", orgId);
  getReport = (id: string) => this.get<Report>(C.reports, id);
  findReportByTracking = (trackingId: string) => this.first<Report>(C.reports, "trackingId", trackingId);
  addReport = (r: Report) => this.put(C.reports, r.id, r);
  saveReport = (r: Report) => this.put(C.reports, r.id, r);

  listPulses = (orgId: string) => this.where<Pulse>(C.pulses, "orgId", orgId);
  addPulse = (p: Pulse) => this.put(C.pulses, p.id, p);

  listSkills = (workerId: string) => this.where<SkillEntry>(C.skills, "workerId", workerId);
  saveSkill = (s: SkillEntry) => this.put(C.skills, s.id, s);

  async listPayRecords(workerIds: readonly string[]) {
    const ids = new Set(workerIds);
    return (await this.all<PayRecord>(C.payRecords)).filter((p) => ids.has(p.workerId));
  }

  async listFatigueActions(workerIds: readonly string[]) {
    const ids = new Set(workerIds);
    return (await this.all<FatigueAction>(C.fatigueActions)).filter((a) => ids.has(a.workerId));
  }
  addFatigueAction = (a: FatigueAction) => this.put(C.fatigueActions, a.id, a);

  async listAnnouncements(orgId: string) {
    return (await this.where<Announcement>(C.announcements, "orgId", orgId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  addAnnouncement = (a: Announcement) => this.put(C.announcements, a.id, a);
}

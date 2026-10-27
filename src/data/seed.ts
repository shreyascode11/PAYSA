import { addDays, dayRange, localDateKey, localDayStart, weekStartKey } from "@/lib/time";
import type {
  Admin,
  Announcement,
  FatigueAction,
  Lang,
  Org,
  PayRecord,
  Pulse,
  Report,
  Shift,
  Site,
  SkillEntry,
  Worker,
} from "@/lib/types";

export interface SeedData {
  orgs: Org[];
  sites: Site[];
  workers: Worker[];
  admins: Admin[];
  shifts: Shift[];
  reports: Report[];
  pulses: Pulse[];
  skills: SkillEntry[];
  payRecords: PayRecord[];
  fatigueActions: FatigueAction[];
  announcements: Announcement[];
}

export const DEMO = {
  pin: "1234",
  adminEmail: "admin@paysa.demo",
  adminPassword: "demo1234",
  constructionWorkerPhone: "9000000001",
  collegeWorkerPhone: "9000000101",
  hindiWorkerPhone: "9000000002",
  trackingId: "PS-7K2Q9M",
} as const;

/** Small deterministic PRNG so the demo looks the same on every cold start. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pattern = "day" | "rotating" | "night12";

interface Profile {
  id: string;
  orgId: "org-con" | "org-col";
  teamId: string;
  siteId: string;
  name: string;
  phone: string;
  lang: Lang;
  role: string;
  dailyWage: number;
  joinedDaysAgo: number;
  pattern: Pattern;
  overworkRecent?: boolean;
  absentRecent?: boolean;
  latePay?: boolean;
  advance?: number;
  skills: [string, 1 | 2 | 3, SkillEntry["source"]][];
  /** Demo logins stay checked-out so judges can try "Start work". */
  demo?: boolean;
}

const P: Profile[] = [
  // Construction · Masonry crew
  { id: "w-c01", orgId: "org-con", teamId: "con-a", siteId: "site-con-1", name: "Murugan Selvam", phone: DEMO.constructionWorkerPhone, lang: "ta", role: "Mason", dailyWage: 800, joinedDaysAgo: 700, pattern: "day", overworkRecent: true, demo: true, advance: 500, skills: [["masonry", 3, "employer"], ["scaffolding", 2, "experience"], ["safety_induction", 1, "training"]] },
  { id: "w-c02", orgId: "org-con", teamId: "con-a", siteId: "site-con-1", name: "Ramesh Kumar", phone: DEMO.hindiWorkerPhone, lang: "hi", role: "Helper", dailyWage: 600, joinedDaysAgo: 300, pattern: "day", demo: true, skills: [["masonry", 1, "experience"], ["safety_induction", 1, "training"]] },
  { id: "w-c03", orgId: "org-con", teamId: "con-a", siteId: "site-con-1", name: "Anbu Raj", phone: "9000000003", lang: "ta", role: "Mason", dailyWage: 850, joinedDaysAgo: 500, pattern: "day", absentRecent: true, skills: [["masonry", 3, "experience"], ["plumbing", 1, "experience"]] },
  { id: "w-c04", orgId: "org-con", teamId: "con-a", siteId: "site-con-1", name: "Sunil Yadav", phone: "9000000004", lang: "hi", role: "Helper", dailyWage: 600, joinedDaysAgo: 200, pattern: "day", latePay: true, skills: [["bar_bending", 1, "experience"]] },
  { id: "w-c05", orgId: "org-con", teamId: "con-a", siteId: "site-con-1", name: "Karthik Muthu", phone: "9000000005", lang: "ta", role: "Bar bender", dailyWage: 750, joinedDaysAgo: 45, pattern: "day", skills: [["bar_bending", 2, "training"], ["safety_induction", 1, "training"]] },
  { id: "w-c06", orgId: "org-con", teamId: "con-a", siteId: "site-con-1", name: "Priya Devi", phone: "9000000006", lang: "ta", role: "Helper", dailyWage: 600, joinedDaysAgo: 400, pattern: "day", skills: [["masonry", 1, "experience"]] },
  { id: "w-c07", orgId: "org-con", teamId: "con-a", siteId: "site-con-1", name: "Imran Sheikh", phone: "9000000007", lang: "hi", role: "Mason", dailyWage: 800, joinedDaysAgo: 650, pattern: "day", overworkRecent: true, skills: [["masonry", 2, "employer"], ["welding", 1, "training"]] },
  // Construction · Steel & scaffolding crew
  { id: "w-c08", orgId: "org-con", teamId: "con-b", siteId: "site-con-2", name: "Arjun Das", phone: "9000000008", lang: "en", role: "Scaffolder", dailyWage: 900, joinedDaysAgo: 900, pattern: "day", skills: [["scaffolding", 3, "employer"], ["safety_induction", 2, "training"]] },
  { id: "w-c09", orgId: "org-con", teamId: "con-b", siteId: "site-con-2", name: "Manoj Paswan", phone: "9000000009", lang: "hi", role: "Welder", dailyWage: 950, joinedDaysAgo: 120, pattern: "day", overworkRecent: true, latePay: true, skills: [["welding", 3, "experience"]] },
  { id: "w-c10", orgId: "org-con", teamId: "con-b", siteId: "site-con-2", name: "Velu Pandian", phone: "9000000010", lang: "ta", role: "Scaffolder", dailyWage: 850, joinedDaysAgo: 600, pattern: "day", skills: [["scaffolding", 2, "experience"]] },
  { id: "w-c11", orgId: "org-con", teamId: "con-b", siteId: "site-con-2", name: "Rakesh Mahto", phone: "9000000011", lang: "hi", role: "Helper", dailyWage: 600, joinedDaysAgo: 60, pattern: "day", absentRecent: true, skills: [["bar_bending", 1, "experience"]] },
  { id: "w-c12", orgId: "org-con", teamId: "con-b", siteId: "site-con-2", name: "Senthil Kumar", phone: "9000000012", lang: "ta", role: "Electrician", dailyWage: 1000, joinedDaysAgo: 1100, pattern: "day", skills: [["electrical", 3, "employer"], ["safety_induction", 2, "training"]] },
  { id: "w-c13", orgId: "org-con", teamId: "con-b", siteId: "site-con-2", name: "Bablu Singh", phone: "9000000013", lang: "hi", role: "Helper", dailyWage: 600, joinedDaysAgo: 250, pattern: "day", advance: 1000, skills: [["plumbing", 1, "experience"]] },
  // College · Housekeeping
  { id: "w-k01", orgId: "org-col", teamId: "col-hk", siteId: "site-col-1", name: "Lakshmi Ramasamy", phone: DEMO.collegeWorkerPhone, lang: "ta", role: "Housekeeping", dailyWage: 550, joinedDaysAgo: 800, pattern: "rotating", demo: true, skills: [["housekeeping", 3, "employer"], ["lab_assistance", 1, "training"]] },
  { id: "w-k02", orgId: "org-col", teamId: "col-hk", siteId: "site-col-1", name: "Meena Kumari", phone: "9000000102", lang: "hi", role: "Housekeeping", dailyWage: 550, joinedDaysAgo: 350, pattern: "day", skills: [["housekeeping", 2, "experience"]] },
  { id: "w-k03", orgId: "org-col", teamId: "col-hk", siteId: "site-col-1", name: "Selvi Arumugam", phone: "9000000103", lang: "ta", role: "Housekeeping supervisor", dailyWage: 700, joinedDaysAgo: 1500, pattern: "day", skills: [["housekeeping", 3, "employer"]] },
  { id: "w-k04", orgId: "org-col", teamId: "col-hk", siteId: "site-col-2", name: "Sarita Devi", phone: "9000000104", lang: "hi", role: "Housekeeping", dailyWage: 550, joinedDaysAgo: 420, pattern: "rotating", absentRecent: true, skills: [["housekeeping", 2, "experience"]] },
  { id: "w-k05", orgId: "org-col", teamId: "col-hk", siteId: "site-col-2", name: "Kavitha Mani", phone: "9000000105", lang: "ta", role: "Housekeeping", dailyWage: 550, joinedDaysAgo: 520, pattern: "day", overworkRecent: true, skills: [["housekeeping", 2, "experience"], ["gardening", 1, "experience"]] },
  { id: "w-k06", orgId: "org-col", teamId: "col-hk", siteId: "site-col-1", name: "Pooja Sharma", phone: "9000000106", lang: "hi", role: "Lab assistant", dailyWage: 650, joinedDaysAgo: 30, pattern: "day", skills: [["lab_assistance", 2, "training"]] },
  { id: "w-k07", orgId: "org-col", teamId: "col-hk", siteId: "site-col-1", name: "Revathi Ganesan", phone: "9000000107", lang: "ta", role: "Gardener", dailyWage: 550, joinedDaysAgo: 700, pattern: "day", latePay: true, skills: [["gardening", 3, "experience"]] },
  { id: "w-k08", orgId: "org-col", teamId: "col-hk", siteId: "site-col-1", name: "John Peter", phone: "9000000108", lang: "en", role: "Housekeeping", dailyWage: 550, joinedDaysAgo: 260, pattern: "day", skills: [["housekeeping", 1, "experience"]] },
  // College · Maintenance & security (only 4 people: shows the k-anonymity gate)
  { id: "w-k09", orgId: "org-col", teamId: "col-mt", siteId: "site-col-1", name: "Ganesh Babu", phone: "9000000109", lang: "ta", role: "Electrician", dailyWage: 800, joinedDaysAgo: 950, pattern: "rotating", skills: [["electrical_maintenance", 3, "employer"], ["plumbing", 1, "experience"]] },
  { id: "w-k10", orgId: "org-col", teamId: "col-mt", siteId: "site-col-2", name: "Abdul Rahman", phone: "9000000110", lang: "en", role: "Security guard", dailyWage: 650, joinedDaysAgo: 80, pattern: "night12", latePay: true, skills: [["security", 2, "experience"]] },
  { id: "w-k11", orgId: "org-col", teamId: "col-mt", siteId: "site-col-1", name: "Vijay Prakash", phone: "9000000111", lang: "hi", role: "Plumber", dailyWage: 750, joinedDaysAgo: 330, pattern: "day", skills: [["plumbing", 3, "experience"]] },
  { id: "w-k12", orgId: "org-col", teamId: "col-mt", siteId: "site-col-2", name: "Muthu Krishnan", phone: "9000000112", lang: "ta", role: "Security guard", dailyWage: 650, joinedDaysAgo: 75, pattern: "rotating", skills: [["security", 1, "training"]] },
];

const ORGS: Org[] = [
  {
    id: "org-con",
    name: "Sri Vinayaka Builders",
    sector: "construction",
    teams: [
      { id: "con-a", name: "Masonry crew" },
      { id: "con-b", name: "Steel & scaffolding crew" },
    ],
  },
  {
    id: "org-col",
    name: "Greenfield College of Engineering",
    sector: "college",
    teams: [
      { id: "col-hk", name: "Housekeeping" },
      { id: "col-mt", name: "Maintenance & security" },
    ],
  },
];

const SITES: Site[] = [
  { id: "site-con-1", orgId: "org-con", name: "Tower B, Guduvanchery", lat: 12.8452, lng: 80.0603, radiusM: 200 },
  { id: "site-con-2", orgId: "org-con", name: "Metro Depot, Tambaram", lat: 12.9249, lng: 80.1, radiusM: 250 },
  { id: "site-col-1", orgId: "org-col", name: "Main Campus", lat: 12.8231, lng: 80.0444, radiusM: 400 },
  { id: "site-col-2", orgId: "org-col", name: "Hostel Block", lat: 12.8205, lng: 80.0402, radiusM: 200 },
];

const HISTORY_DAYS = 42;
const HOUR = 3_600_000;

function at(dayKey: string, hour: number): Date {
  return new Date(localDayStart(dayKey).getTime() + hour * HOUR);
}

function shiftsFor(p: Profile, today: string, rand: () => number): { start: Date; end: Date }[] {
  const joined = addDays(today, -p.joinedDaysAgo);
  const recentFrom = addDays(today, -14);
  const out: { start: Date; end: Date }[] = [];
  const days = dayRange(addDays(today, -HISTORY_DAYS), addDays(today, -1)).filter((d) => d >= joined);
  const covered = new Set<string>();
  for (const day of days) {
    if (covered.has(day)) continue;
    const recent = day >= recentFrom;
    const sunday = new Date(`${day}T00:00:00Z`).getUTCDay() === 0;
    const overwork = recent && p.overworkRecent;
    if (sunday && !overwork) continue;
    if (recent && p.absentRecent && rand() < 0.5) continue;
    if (!recent && rand() < 0.04) continue;

    const jitter = (rand() - 0.3) * 0.8;
    if (overwork) {
      // Long days, every day: drives warn/critical fatigue and long weeks.
      const start = 7 + rand() * 0.5;
      out.push({ start: at(day, start), end: at(day, start + 10.5 + rand() * 2.5) });
    } else if (p.pattern === "night12") {
      out.push({ start: at(day, 20), end: at(day, 32 + jitter * 0.25) });
    } else if (p.pattern === "rotating") {
      const week = Math.floor(Date.parse(`${weekStartKey(day)}T00:00:00Z`) / (7 * 24 * HOUR));
      const slot = [6, 14, 22][week % 3] ?? 6;
      // Occasional "clopen": a morning shift right after an evening one leaves only 8h rest.
      const clopen = slot === 14 && recent && rand() < 0.25;
      out.push({ start: at(day, slot), end: at(day, slot + 8 + jitter) });
      const next = addDays(day, 1);
      if (clopen && next < today) {
        out.push({ start: at(next, 6), end: at(next, 14 + jitter) });
        covered.add(next);
      }
    } else {
      const start = 8 + rand() * 0.33;
      out.push({ start: at(day, start), end: at(day, start + 8 + jitter + (rand() < 0.2 ? 1.5 : 0)) });
    }
  }
  return out;
}

function payRecordsFor(p: Profile, today: string): PayRecord[] {
  const records: PayRecord[] = [];
  const thisWeek = weekStartKey(today);
  for (let w = 6; w >= 1; w--) {
    const start = addDays(thisWeek, -7 * w);
    const end = addDays(start, 6);
    const due = addDays(end, 3);
    const inLateWindow = due >= addDays(today, -14) && due < today;
    let paidDate: string | undefined = due;
    if (p.latePay && inLateWindow) paidDate = w === 1 ? undefined : addDays(due, 4);
    if (due >= today) paidDate = undefined;
    records.push({
      workerId: p.id,
      periodStart: start,
      periodEnd: end,
      dueDate: due,
      paidDate,
      advance: w === 1 ? p.advance : undefined,
    });
  }
  // Current week: advance (if any) is taken against the running week too.
  records.push({
    workerId: p.id,
    periodStart: thisWeek,
    periodEnd: addDays(thisWeek, 6),
    dueDate: addDays(thisWeek, 9),
    advance: p.advance,
  });
  return records;
}

interface ReportSeed {
  orgId: string;
  siteId?: string;
  type: Report["type"];
  category: string;
  severity: Report["severity"];
  lang: Lang;
  text: string;
  textEn: string;
  status: Report["status"];
  hoursAgo: number;
  trackingId: string;
  workerId?: string;
  updates?: [number, Report["status"], string][];
  messages?: [number, "worker" | "admin", string][];
}

const REPORTS: ReportSeed[] = [
  { orgId: "org-con", siteId: "site-con-1", type: "hazard", category: "fall_height", severity: 4, lang: "ta", text: "ஐந்தாவது மாடியில் சாரத்துக்கு கைப்பிடி இல்லை. நேற்று ஒருவர் கிட்டத்தட்ட விழுந்தார்.", textEn: "There is no guard rail on the scaffolding on the 5th floor. Yesterday someone almost fell.", status: "received", hoursAgo: 3, trackingId: DEMO.trackingId },
  { orgId: "org-con", siteId: "site-con-2", type: "hazard", category: "ppe_missing", severity: 3, lang: "hi", text: "हेलमेट और जूते नहीं मिले, तीन दिन से बिना सुरक्षा के काम कर रहे हैं।", textEn: "We have not been given helmets and shoes; we have been working without safety gear for three days.", status: "in_review", hoursAgo: 50, trackingId: "PS-H3KMT4", updates: [[30, "in_review", "Checking stock with stores."]], messages: [[29, "admin", "Thank you. Which team is missing gear? We are ordering 40 helmets today."], [20, "worker", "Steel crew, about 6 people."]] },
  { orgId: "org-con", siteId: "site-con-1", type: "grievance", category: "pay", severity: 2, lang: "en", text: "Last week's wages have not come yet. I have rent to pay.", textEn: "Last week's wages have not come yet. I have rent to pay.", status: "in_review", hoursAgo: 70, trackingId: "PS-PAY8WK", workerId: "w-c04", updates: [[48, "in_review", "Escalated to accounts."]] },
  { orgId: "org-con", siteId: "site-con-1", type: "hazard", category: "electrical", severity: 3, lang: "ta", text: "தண்ணீர் தேங்கிய இடத்தில் மின் கம்பி திறந்து கிடக்கிறது.", textEn: "An electric wire is lying open where water has collected.", status: "action_taken", hoursAgo: 120, trackingId: "PS-W2RE5X", updates: [[100, "in_review", "Electrician sent."], [80, "action_taken", "Wire insulated and area barricaded."]] },
  { orgId: "org-con", siteId: "site-con-1", type: "manager_feedback", category: "manager", severity: 2, lang: "hi", text: "सुपरवाइज़र गाली देते हैं और ओवरटाइम ज़बरदस्ती करवाते हैं, मना करने पर पैसे काटने की धमकी देते हैं।", textEn: "The supervisor uses abusive language and forces overtime, threatening to cut pay if we refuse.", status: "received", hoursAgo: 26, trackingId: "PS-MGR6QT" },
  { orgId: "org-con", siteId: "site-con-2", type: "hazard", category: "heat", severity: 2, lang: "en", text: "No shade or water near the depot slab in the afternoon.", textEn: "No shade or water near the depot slab in the afternoon.", status: "resolved", hoursAgo: 220, trackingId: "PS-HEAT3Z", updates: [[200, "action_taken", "Shade net and water drum installed."], [180, "resolved", "Confirmed by site engineer."]] },
  { orgId: "org-col", siteId: "site-col-1", type: "hazard", category: "wet_floor", severity: 2, lang: "ta", text: "நூலக படிக்கட்டில் தண்ணீர் கசிகிறது, மாணவர்கள் வழுக்குகிறார்கள்.", textEn: "Water is leaking on the library staircase and students are slipping.", status: "resolved", hoursAgo: 160, trackingId: "PS-WET5ST", updates: [[150, "action_taken", "Pipe repaired."], [140, "resolved", "Signage placed."]] },
  { orgId: "org-col", siteId: "site-col-2", type: "hazard", category: "chemical_cleaning", severity: 3, lang: "hi", text: "बिना दस्ताने के एसिड से टॉयलेट साफ़ करना पड़ता है, हाथ जल रहे हैं।", textEn: "We have to clean toilets with acid without gloves; our hands are burning.", status: "in_review", hoursAgo: 40, trackingId: "PS-ACD9GV", updates: [[30, "in_review", "Purchase request raised for gloves."]], messages: [[28, "admin", "Sorry about this. Gloves arrive tomorrow. Is anyone injured and needing the clinic?"]] },
  { orgId: "org-col", siteId: "site-col-2", type: "hazard", category: "harassment", severity: 4, lang: "ta", text: "இரவு ஷிஃப்டில் ஒரு விடுதி மாணவர் தொடர்ந்து தவறாக நடந்துகொள்கிறார். பயமாக இருக்கிறது.", textEn: "During the night shift a hostel resident keeps behaving inappropriately. I feel scared.", status: "received", hoursAgo: 5, trackingId: "PS-N8GHTS" },
  { orgId: "org-col", siteId: "site-col-2", type: "grievance", category: "hours", severity: 2, lang: "en", text: "Night shifts are 12 hours, 6 days a week. We need relief staff.", textEn: "Night shifts are 12 hours, 6 days a week. We need relief staff.", status: "received", hoursAgo: 60, trackingId: "PS-NT72HR", workerId: "w-k10" },
  { orgId: "org-col", siteId: "site-col-2", type: "manager_feedback", category: "conditions", severity: 1, lang: "en", text: "No drinking water near the hostel block during the day.", textEn: "No drinking water near the hostel block during the day.", status: "action_taken", hoursAgo: 300, trackingId: "PS-WTR4HB", updates: [[250, "action_taken", "Water cooler installed."]] },
];

const ANNOUNCEMENTS: { orgId: string; hoursAgo: number; text: Record<Lang, string>; written: Lang }[] = [
  {
    orgId: "org-con",
    hoursAgo: 4,
    written: "ta",
    text: {
      ta: "வெப்ப எச்சரிக்கை: இன்று மதியம் 12 முதல் 3 மணி வரை வேலை நிறுத்தம். ஒவ்வொரு மணி நேரமும் தண்ணீர் குடியுங்கள்.",
      hi: "गर्मी की चेतावनी: आज दोपहर 12 से 3 बजे तक काम बंद रहेगा। हर घंटे पानी पिएँ।",
      en: "Heat alert: work pauses from 12 to 3 pm today. Drink water every hour.",
    },
  },
  {
    orgId: "org-con",
    hoursAgo: 30,
    written: "hi",
    text: {
      hi: "शनिवार को सुबह 9 बजे सुरक्षा प्रशिक्षण है। हेलमेट साथ लाएँ।",
      ta: "சனிக்கிழமை காலை 9 மணிக்கு பாதுகாப்புப் பயிற்சி. ஹெல்மெட் கொண்டு வாருங்கள்.",
      en: "Safety training on Saturday at 9 am. Bring your helmet.",
    },
  },
  {
    orgId: "org-col",
    hoursAgo: 6,
    written: "en",
    text: {
      en: "Gloves and masks are now available at the housekeeping store. Ask your supervisor.",
      ta: "கையுறைகளும் முகக்கவசங்களும் இப்போது தூய்மைப் பணி கிடங்கில் கிடைக்கும். மேற்பார்வையாளரிடம் கேளுங்கள்.",
      hi: "दस्ताने और मास्क अब हाउसकीपिंग स्टोर में मिल रहे हैं। अपने सुपरवाइज़र से माँगें।",
    },
  },
];

const PULSE_PLAN: Record<string, { weeksAgo: number[]; perWeek: number; scores: number[] }> = {
  "con-a": { weeksAgo: [0, 1, 2], perWeek: 6, scores: [1, 2, 2, 1, 3, 2] },
  "con-b": { weeksAgo: [4, 5], perWeek: 5, scores: [3, 4, 3, 4, 3] },
  "col-hk": { weeksAgo: [0, 1, 2], perWeek: 6, scores: [4, 3, 4, 5, 3, 4] },
  "col-mt": { weeksAgo: [0, 1], perWeek: 2, scores: [2, 3] },
};

export function buildSeed(now: Date, pinHash: string, adminPasswordHash: string): SeedData {
  const rand = mulberry32(8);
  const today = localDateKey(now);
  const iso = (d: Date): string => d.toISOString();
  const hoursAgo = (h: number): string => new Date(now.getTime() - h * HOUR).toISOString();
  const hourFloor = (h: number): string => {
    const d = new Date(now.getTime() - h * HOUR);
    d.setUTCMinutes(0, 0, 0);
    return d.toISOString();
  };

  const workers: Worker[] = P.map((p) => ({
    id: p.id,
    orgId: p.orgId,
    name: p.name,
    phone: p.phone,
    pinHash,
    lang: p.lang,
    role: p.role,
    dailyWage: p.dailyWage,
    hourlyRate: p.dailyWage / 8,
    teamId: p.teamId,
    joinedAt: iso(at(addDays(today, -p.joinedDaysAgo), 9)),
    passportId: `pp-${p.id.slice(2)}-${Math.floor(rand() * 1e6).toString(36)}`,
  }));

  const shifts: Shift[] = [];
  const nowHour = (now.getTime() - localDayStart(today).getTime()) / HOUR;
  const isSunday = new Date(`${today}T00:00:00Z`).getUTCDay() === 0;
  for (const p of P) {
    shiftsFor(p, today, rand).forEach((s, i) => {
      shifts.push({ id: `sh-${p.id}-${i}`, workerId: p.id, siteId: p.siteId, checkIn: iso(s.start), checkOut: iso(s.end), method: rand() < 0.7 ? "qr" : "geo" });
    });
    // People already on site this morning make the "on-site now" KPI real.
    if (!p.demo && !isSunday && p.pattern === "day" && nowHour >= 8.5 && nowHour < 17 && !(p.absentRecent && rand() < 0.5)) {
      shifts.push({ id: `sh-${p.id}-today`, workerId: p.id, siteId: p.siteId, checkIn: iso(at(today, 8 + rand() * 0.4)), method: "qr" });
    }
  }

  const reports: Report[] = REPORTS.map((r, i) => {
    const anonymous = !r.workerId;
    return {
      id: `rp-${i + 1}`,
      trackingId: r.trackingId,
      orgId: r.orgId,
      siteId: r.siteId,
      type: r.type,
      category: r.category,
      severity: r.severity,
      textOriginal: r.text,
      langOriginal: r.lang,
      textEn: r.textEn,
      status: r.status,
      anonymous,
      ...(anonymous ? {} : { workerId: r.workerId }),
      createdAt: anonymous ? hourFloor(r.hoursAgo) : hoursAgo(r.hoursAgo),
      updates: [
        { at: anonymous ? hourFloor(r.hoursAgo) : hoursAgo(r.hoursAgo), status: "received" as const, note: "" },
        ...(r.updates ?? []).map(([h, status, note]) => ({ at: hoursAgo(h), status, note })),
      ],
      messages: (r.messages ?? []).map(([h, from, text]) => ({ at: hoursAgo(h), from, text })),
    };
  });

  const pulses: Pulse[] = [];
  for (const [teamId, plan] of Object.entries(PULSE_PLAN)) {
    const orgId = teamId.startsWith("con") ? "org-con" : "org-col";
    for (const w of plan.weeksAgo) {
      const weekOf = addDays(weekStartKey(today), -7 * w);
      for (let i = 0; i < plan.perWeek; i++) {
        const score = (plan.scores[i % plan.scores.length] ?? 3) as Pulse["score"];
        pulses.push({ id: `pu-${teamId}-${w}-${i}`, orgId, teamId, weekOf, score });
      }
    }
  }

  const skills: SkillEntry[] = P.flatMap((p) =>
    p.skills.map(([skill, level, source], i) => ({
      id: `sk-${p.id}-${i}`,
      workerId: p.id,
      skill,
      level,
      source,
      endorsedBy: source === "employer" ? p.orgId : undefined,
      date: addDays(today, -Math.min(p.joinedDaysAgo, 30 + i * 40)),
    })),
  );

  const announcements: Announcement[] = ANNOUNCEMENTS.map((a, i) => ({
    id: `an-${i + 1}`,
    orgId: a.orgId,
    lang: a.written,
    text: a.text[a.written],
    translations: a.text,
    createdAt: hoursAgo(a.hoursAgo),
  }));

  return {
    orgs: ORGS,
    sites: SITES,
    workers,
    admins: [{ id: "ad-1", email: DEMO.adminEmail, name: "Demo HR", passwordHash: adminPasswordHash, orgIds: ["org-con", "org-col"] }],
    shifts,
    reports,
    pulses,
    skills,
    payRecords: P.flatMap((p) => payRecordsFor(p, today)),
    fatigueActions: [],
    announcements,
  };
}

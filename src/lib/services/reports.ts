import "server-only";
import { analyzeReport } from "../ai/gemini";
import type { Repository } from "../repo/types";
import { generateTrackingId, reportIdentity } from "../rules/anonymity";
import { categoriesFor } from "../sectors";
import type { Lang, Org, Report, ReportMessage, ReportStatus, ReportType } from "../types";

export interface NewReportInput {
  org: Org;
  workerId: string;
  type: ReportType;
  category: string;
  text: string;
  lang: Lang;
  anonymous: boolean;
  siteId?: string;
  photoUrl?: string;
  textEn?: string;
}

export async function createReport(repo: Repository, input: NewReportInput, now = new Date()): Promise<Report> {
  const allowed = categoriesFor(input.type, input.org.sector);
  const analysis = await analyzeReport({
    text: input.text,
    lang: input.lang,
    type: input.type,
    allowedCategories: allowed,
    chosenCategory: allowed.includes(input.category) ? input.category : "other",
    textEn: input.textEn,
  });

  let trackingId = generateTrackingId();
  while (await repo.findReportByTracking(trackingId)) trackingId = generateTrackingId();

  const identity = reportIdentity({ anonymous: input.anonymous, workerId: input.workerId, now });
  const report: Report = {
    id: crypto.randomUUID(),
    trackingId,
    orgId: input.org.id,
    siteId: input.siteId,
    type: input.type,
    category: analysis.category,
    severity: analysis.severity,
    textOriginal: input.text,
    langOriginal: input.lang,
    textEn: analysis.textEn,
    photoUrl: input.photoUrl,
    status: "received",
    anonymous: input.anonymous,
    ...identity,
    updates: [{ at: identity.createdAt, status: "received", note: "" }],
    messages: [],
  };
  await repo.addReport(report);
  return report;
}

/** What anyone holding the tracking code may see. Deliberately excludes every identity field. */
export interface PublicReport {
  trackingId: string;
  type: ReportType;
  category: string;
  status: ReportStatus;
  text: string;
  createdAt: string;
  updates: { at: string; status: ReportStatus; note: string }[];
  messages: ReportMessage[];
}

export function toPublicReport(r: Report): PublicReport {
  return {
    trackingId: r.trackingId,
    type: r.type,
    category: r.category,
    status: r.status,
    text: r.textOriginal,
    createdAt: r.createdAt,
    updates: r.updates.map(({ at, status, note }) => ({ at, status, note })),
    messages: r.messages.map(({ from, text, at }) => ({ from, text, at })),
  };
}

export function addMessage(r: Report, from: ReportMessage["from"], text: string, now = new Date()): Report {
  // Anonymous replies get hour-level time only, like the report itself.
  const at = from === "worker" && r.anonymous ? reportIdentity({ anonymous: true, now }).createdAt : now.toISOString();
  return { ...r, messages: [...r.messages, { from, text, at }] };
}

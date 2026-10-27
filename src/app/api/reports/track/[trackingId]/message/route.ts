import { NextResponse } from "next/server";
import { jsonError, parseJson } from "@/lib/http";
import { LIMITS, clientKey, take } from "@/lib/rate-limit";
import { getRepo } from "@/lib/repo";
import { TRACKING_ID_PATTERN, normalizeTrackingId } from "@/lib/rules/anonymity";
import { addMessage } from "@/lib/services/reports";
import { messageSchema } from "@/lib/validation";

/** Worker reply in the anonymous two-way chat. No session needed: holding the code is the credential. */
export async function POST(req: Request, { params }: { params: Promise<{ trackingId: string }> }) {
  if (!take(clientKey(req, "report"), LIMITS.report)) return jsonError("rate_limited", 429);
  const id = normalizeTrackingId((await params).trackingId);
  if (!TRACKING_ID_PATTERN.test(id)) return jsonError("not_found", 404);
  const parsed = await parseJson(req, messageSchema);
  if ("error" in parsed) return parsed.error;
  const repo = getRepo();
  const report = await repo.findReportByTracking(id);
  if (!report) return jsonError("not_found", 404);
  await repo.saveReport(addMessage(report, "worker", parsed.data.text));
  return NextResponse.json({ ok: true }, { status: 201 });
}

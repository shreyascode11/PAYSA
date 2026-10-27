import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { getRepo } from "@/lib/repo";
import { TRACKING_ID_PATTERN, normalizeTrackingId } from "@/lib/rules/anonymity";
import { toPublicReport } from "@/lib/services/reports";

/** Public by design: the tracking code is the only key, and the response carries no identity. */
export async function GET(_req: Request, { params }: { params: Promise<{ trackingId: string }> }) {
  const id = normalizeTrackingId((await params).trackingId);
  if (!TRACKING_ID_PATTERN.test(id)) return jsonError("not_found", 404);
  const report = await getRepo().findReportByTracking(id);
  if (!report) return jsonError("not_found", 404);
  return NextResponse.json(toPublicReport(report));
}

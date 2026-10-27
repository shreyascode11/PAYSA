import { NextResponse } from "next/server";
import { adminApi } from "@/lib/api-auth";
import { getAdminSession } from "@/lib/auth";
import { jsonError, parseJson } from "@/lib/http";
import { getRepo } from "@/lib/repo";
import { categoriesFor } from "@/lib/sectors";
import { applyAdminUpdate } from "@/lib/services/reports";
import type { ReportStatus, Severity } from "@/lib/types";
import { reportUpdateSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return jsonError("unauthorized", 401);
  const report = await getRepo().getReport((await params).id);
  if (!report) return jsonError("not_found", 404);
  const auth = await adminApi(report.orgId);
  if (!auth.ok) return auth.res;
  const parsed = await parseJson(req, reportUpdateSchema);
  if ("error" in parsed) return parsed.error;
  const { status, note, severity, category } = parsed.data;
  const updated = applyAdminUpdate(
    report,
    { status: status as ReportStatus, note, severity: severity as Severity | undefined, category },
    categoriesFor(report.type, auth.value.org.sector),
  );
  await auth.value.repo.saveReport(updated);
  return NextResponse.json({ ok: true, status: updated.status, severity: updated.severity, category: updated.category });
}

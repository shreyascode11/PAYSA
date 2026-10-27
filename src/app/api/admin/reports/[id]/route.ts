import { NextResponse } from "next/server";
import { adminForReport } from "@/lib/api-auth";
import { parseJson } from "@/lib/http";
import { categoriesFor } from "@/lib/sectors";
import { applyAdminUpdate } from "@/lib/services/reports";
import { reportUpdateSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await adminForReport((await params).id);
  if (!auth.ok) return auth.res;
  const parsed = await parseJson(req, reportUpdateSchema);
  if ("error" in parsed) return parsed.error;
  const { repo, org, entity: report } = auth.value;
  const updated = applyAdminUpdate(report, parsed.data, categoriesFor(report.type, org.sector));
  await repo.saveReport(updated);
  return NextResponse.json({ ok: true, status: updated.status, severity: updated.severity, category: updated.category });
}

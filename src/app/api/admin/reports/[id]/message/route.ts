import { NextResponse } from "next/server";
import { adminApi } from "@/lib/api-auth";
import { getAdminSession } from "@/lib/auth";
import { jsonError, parseJson } from "@/lib/http";
import { getRepo } from "@/lib/repo";
import { addMessage } from "@/lib/services/reports";
import { messageSchema } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return jsonError("unauthorized", 401);
  const report = await getRepo().getReport((await params).id);
  if (!report) return jsonError("not_found", 404);
  const auth = await adminApi(report.orgId);
  if (!auth.ok) return auth.res;
  const parsed = await parseJson(req, messageSchema);
  if ("error" in parsed) return parsed.error;
  await auth.value.repo.saveReport(addMessage(report, "admin", parsed.data.text));
  return NextResponse.json({ ok: true }, { status: 201 });
}

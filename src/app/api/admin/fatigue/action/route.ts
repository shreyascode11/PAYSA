import { NextResponse } from "next/server";
import { adminApi } from "@/lib/api-auth";
import { getAdminSession } from "@/lib/auth";
import { jsonError, parseJson } from "@/lib/http";
import { getRepo } from "@/lib/repo";
import { fatigueActionSchema } from "@/lib/validation";

export async function POST(req: Request) {
  if (!(await getAdminSession())) return jsonError("unauthorized", 401);
  const parsed = await parseJson(req, fatigueActionSchema);
  if ("error" in parsed) return parsed.error;
  const worker = await getRepo().getWorker(parsed.data.workerId);
  if (!worker) return jsonError("not_found", 404);
  const auth = await adminApi(worker.orgId);
  if (!auth.ok) return auth.res;
  await auth.value.repo.addFatigueAction({ id: crypto.randomUUID(), ...parsed.data, at: new Date().toISOString() });
  return NextResponse.json({ ok: true }, { status: 201 });
}

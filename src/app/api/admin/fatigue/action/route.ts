import { NextResponse } from "next/server";
import { adminForWorker } from "@/lib/api-auth";
import { getAdminSession } from "@/lib/auth";
import { jsonError, parseJson } from "@/lib/http";
import { fatigueActionSchema } from "@/lib/validation";

export async function POST(req: Request) {
  if (!(await getAdminSession())) return jsonError("unauthorized", 401);
  const parsed = await parseJson(req, fatigueActionSchema);
  if ("error" in parsed) return parsed.error;
  const auth = await adminForWorker(parsed.data.workerId);
  if (!auth.ok) return auth.res;
  await auth.value.repo.addFatigueAction({ id: crypto.randomUUID(), ...parsed.data, at: new Date().toISOString() });
  return NextResponse.json({ ok: true }, { status: 201 });
}

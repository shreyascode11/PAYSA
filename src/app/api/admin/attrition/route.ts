import { NextResponse } from "next/server";
import { adminApi } from "@/lib/api-auth";
import { attritionTable, loadOrgData } from "@/lib/services/admin";

export async function GET(req: Request) {
  const auth = await adminApi(new URL(req.url).searchParams.get("orgId"));
  if (!auth.ok) return auth.res;
  const data = await loadOrgData(auth.value.repo, auth.value.org.id);
  const rows = data ? await attritionTable(auth.value.repo, data) : [];
  return NextResponse.json(rows.map((r) => ({ workerId: r.worker.id, name: r.worker.name, ...r.result })));
}

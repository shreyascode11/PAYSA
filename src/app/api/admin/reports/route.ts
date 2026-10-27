import { NextResponse } from "next/server";
import { adminApi } from "@/lib/api-auth";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const auth = await adminApi(q.get("orgId"));
  if (!auth.ok) return auth.res;
  const reports = await auth.value.repo.listReports(auth.value.org.id);
  const filtered = reports.filter(
    (r) =>
      (!q.get("type") || r.type === q.get("type")) &&
      (!q.get("severity") || String(r.severity) === q.get("severity")) &&
      (!q.get("status") || r.status === q.get("status")) &&
      (!q.get("site") || r.siteId === q.get("site")),
  );
  return NextResponse.json(filtered.sort((a, b) => b.severity - a.severity || b.createdAt.localeCompare(a.createdAt)));
}

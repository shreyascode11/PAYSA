import { NextResponse } from "next/server";
import { adminApi } from "@/lib/api-auth";
import { fatigueGrid, loadOrgData } from "@/lib/services/admin";

export async function GET(req: Request) {
  const auth = await adminApi(new URL(req.url).searchParams.get("orgId"));
  if (!auth.ok) return auth.res;
  const data = await loadOrgData(auth.value.repo, auth.value.org.id);
  if (!data) return NextResponse.json({ dates: [], rows: [] });
  const grid = await fatigueGrid(auth.value.repo, data);
  // Strip PIN hashes and pay details: the grid only needs who and how tired.
  return NextResponse.json({
    dates: grid.dates,
    rows: grid.rows.map((r) => ({ workerId: r.worker.id, name: r.worker.name, cells: r.cells })),
  });
}

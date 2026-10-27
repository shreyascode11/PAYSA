import { NextResponse } from "next/server";
import { adminApi } from "@/lib/api-auth";
import { loadOrgData, overview } from "@/lib/services/admin";

export async function GET(req: Request) {
  const auth = await adminApi(new URL(req.url).searchParams.get("orgId"));
  if (!auth.ok) return auth.res;
  const data = await loadOrgData(auth.value.repo, auth.value.org.id);
  return NextResponse.json(data && (await overview(auth.value.repo, data)));
}

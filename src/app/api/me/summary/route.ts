import { NextResponse } from "next/server";
import { workerApi } from "@/lib/api-auth";
import { workerSummary } from "@/lib/services/worker";

export async function GET() {
  const auth = await workerApi();
  if (!auth.ok) return auth.res;
  const { repo, worker, org } = auth.value;
  return NextResponse.json(await workerSummary(repo, { worker, org }));
}

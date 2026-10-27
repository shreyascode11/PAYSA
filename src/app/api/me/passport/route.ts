import { NextResponse } from "next/server";
import { workerApi } from "@/lib/api-auth";
import { buildPassport } from "@/lib/services/passport";

export async function GET() {
  const auth = await workerApi();
  if (!auth.ok) return auth.res;
  return NextResponse.json(await buildPassport(auth.value.repo, auth.value.worker.id));
}

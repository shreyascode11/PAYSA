import { NextResponse } from "next/server";
import { workerApi } from "@/lib/api-auth";
import { jsonError } from "@/lib/http";
import { getLang } from "@/lib/locale";
import { workerPayslip } from "@/lib/services/worker";
import { periodSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const auth = await workerApi();
  if (!auth.ok) return auth.res;
  const raw = new URL(req.url).searchParams.get("period");
  const period = raw === null ? undefined : periodSchema.safeParse(raw);
  if (period && !period.success) return jsonError("invalid_input", 400);
  const { repo, worker, org } = auth.value;
  const view = await workerPayslip(repo, { worker, org }, await getLang(), period?.data);
  return NextResponse.json(view);
}

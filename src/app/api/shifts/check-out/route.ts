import { NextResponse } from "next/server";
import { workerApi } from "@/lib/api-auth";
import { jsonError, parseJson } from "@/lib/http";
import { hoursBetween, round2 } from "@/lib/time";
import { checkOutSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const auth = await workerApi();
  if (!auth.ok) return auth.res;
  const { repo, worker } = auth.value;
  const parsed = await parseJson(req, checkOutSchema);
  if ("error" in parsed) return parsed.error;

  const open = await repo.getOpenShift(worker.id);
  if (!open) return jsonError("not_in", 409);
  const now = new Date();
  const closed = await repo.closeShift(open.id, now.toISOString());
  if (!closed) return jsonError("not_in", 409);
  return NextResponse.json({ ok: true, hours: round2(hoursBetween(new Date(open.checkIn), now)) });
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { workerApi } from "@/lib/api-auth";
import { PULSE_COOKIE } from "@/lib/constants";
import { jsonError, parseJson } from "@/lib/http";
import { LIMITS, clientKey, take } from "@/lib/rate-limit";
import { localDateKey, weekStartKey } from "@/lib/time";
import { pulseSchema } from "@/lib/validation";

/** Anonymous weekly mood. Only team + week are stored; the once-a-week guard lives in the worker's own cookie. */
export async function POST(req: Request) {
  const auth = await workerApi();
  if (!auth.ok) return auth.res;
  if (!take(clientKey(req, "pulse"), LIMITS.pulse)) return jsonError("rate_limited", 429);
  const parsed = await parseJson(req, pulseSchema);
  if ("error" in parsed) return parsed.error;

  const weekOf = weekStartKey(localDateKey(new Date()));
  const jar = await cookies();
  if (jar.get(PULSE_COOKIE)?.value === weekOf) return jsonError("already_answered", 409);

  const { repo, worker } = auth.value;
  await repo.addPulse({
    id: crypto.randomUUID(),
    orgId: worker.orgId,
    teamId: worker.teamId,
    weekOf,
    score: parsed.data.score,
  });
  jar.set(PULSE_COOKIE, weekOf, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 8 * 86_400 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

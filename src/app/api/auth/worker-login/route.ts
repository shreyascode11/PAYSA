import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { setSessionCookie, verifySecret } from "@/lib/auth";
import { jsonError, parseJson } from "@/lib/http";
import { LANG_COOKIE } from "@/lib/lang";
import { LIMITS, clientKey, take } from "@/lib/rate-limit";
import { getRepo } from "@/lib/repo";
import { workerLoginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  if (!take(clientKey(req, "login"), LIMITS.login)) return jsonError("rate_limited", 429);
  const parsed = await parseJson(req, workerLoginSchema);
  if ("error" in parsed) return parsed.error;
  const worker = await getRepo().findWorkerByPhone(parsed.data.phone);
  const ok = await verifySecret(parsed.data.pin, worker?.pinHash);
  if (!worker || !ok) return jsonError("invalid_credentials", 401);

  await setSessionCookie({ role: "worker", sub: worker.id, orgId: worker.orgId });
  const jar = await cookies();
  // First login on a device adopts the worker's profile language.
  if (!jar.get(LANG_COOKIE)) {
    jar.set(LANG_COOKIE, worker.lang, { path: "/", maxAge: 31_536_000, sameSite: "lax" });
  }
  return NextResponse.json({ ok: true, redirect: "/w/home" });
}

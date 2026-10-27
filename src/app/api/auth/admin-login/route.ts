import { NextResponse } from "next/server";
import { setSessionCookie, verifySecret } from "@/lib/auth";
import { jsonError, parseJson } from "@/lib/http";
import { LIMITS, clientKey, take } from "@/lib/rate-limit";
import { getRepo } from "@/lib/repo";
import { adminLoginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  if (!take(clientKey(req, "login"), LIMITS.login)) return jsonError("rate_limited", 429);
  const parsed = await parseJson(req, adminLoginSchema);
  if ("error" in parsed) return parsed.error;
  const admin = await getRepo().findAdminByEmail(parsed.data.email);
  const ok = await verifySecret(parsed.data.password, admin?.passwordHash);
  if (!admin || !ok) return jsonError("invalid_credentials", 401);
  await setSessionCookie({ role: "admin", sub: admin.id, orgIds: admin.orgIds });
  return NextResponse.json({ ok: true, redirect: "/admin" });
}

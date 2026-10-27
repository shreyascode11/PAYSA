import { NextResponse } from "next/server";
import { adminApi } from "@/lib/api-auth";
import { getAdminSession } from "@/lib/auth";
import { jsonError, parseJson } from "@/lib/http";
import { announcementSchema } from "@/lib/validation";

export async function POST(req: Request) {
  if (!(await getAdminSession())) return jsonError("unauthorized", 401);
  const parsed = await parseJson(req, announcementSchema);
  if ("error" in parsed) return parsed.error;
  const auth = await adminApi(parsed.data.orgId);
  if (!auth.ok) return auth.res;
  await auth.value.repo.addAnnouncement({
    id: crypto.randomUUID(),
    orgId: auth.value.org.id,
    text: parsed.data.text,
    lang: parsed.data.lang,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}

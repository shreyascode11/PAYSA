import { NextResponse } from "next/server";
import { translateNotice } from "@/lib/ai/gemini";
import { adminApi } from "@/lib/api-auth";
import { getAdminSession } from "@/lib/auth";
import { jsonError, parseJson } from "@/lib/http";
import { LANGS, type Lang } from "@/lib/types";
import { announcementSchema } from "@/lib/validation";

export async function POST(req: Request) {
  if (!(await getAdminSession())) return jsonError("unauthorized", 401);
  const parsed = await parseJson(req, announcementSchema);
  if ("error" in parsed) return parsed.error;
  const auth = await adminApi(parsed.data.orgId);
  if (!auth.ok) return auth.res;

  const { text, lang } = parsed.data;
  // Hand-written translations win; Gemini (when configured) fills whatever is still missing.
  const given = Object.fromEntries(
    Object.entries(parsed.data.translations ?? {}).filter(([, v]) => v && v.length > 0),
  ) as Partial<Record<Lang, string>>;
  given[lang] = text;
  const missing = LANGS.filter((l) => !given[l]);
  const translations = { ...(await translateNotice(text, lang, missing)), ...given };

  await auth.value.repo.addAnnouncement({
    id: crypto.randomUUID(),
    orgId: auth.value.org.id,
    text,
    lang,
    translations,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true, languages: Object.keys(translations) }, { status: 201 });
}

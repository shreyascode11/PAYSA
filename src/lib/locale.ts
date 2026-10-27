import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, isLang, translator, type Translator } from "./i18n";
import type { Lang } from "./types";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : DEFAULT_LANG;
}

export async function getT(): Promise<{ lang: Lang; t: Translator }> {
  const lang = await getLang();
  return { lang, t: translator(lang) };
}

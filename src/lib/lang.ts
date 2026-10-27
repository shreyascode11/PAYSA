// Client-safe language constants (no dictionaries, so importing this never bloats a bundle).
import type { Lang } from "./types";

export const LANG_COOKIE = "fs_lang";
export const DEFAULT_LANG: Lang = "en";
export const LANG_LABELS: Record<Lang, string> = { en: "EN", ta: "தமிழ்", hi: "हिंदी" };
/** BCP-47 tags for <html lang>, Intl and speechSynthesis. */
export const LANG_TAGS: Record<Lang, string> = { en: "en-IN", ta: "ta-IN", hi: "hi-IN" };

export function isLang(v: unknown): v is Lang {
  return v === "en" || v === "ta" || v === "hi";
}

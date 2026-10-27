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

// ICU renders Tamil/Hindi times with English "AM/PM"; workers say "morning 7:09" instead.
const DAY_PERIODS: Record<Exclude<Lang, "en">, [number, string][]> = {
  ta: [[5, "இரவு"], [12, "காலை"], [16, "மதியம்"], [19, "மாலை"], [24, "இரவு"]],
  hi: [[5, "रात"], [12, "सुबह"], [16, "दोपहर"], [19, "शाम"], [24, "रात"]],
};

export function formatTime(iso: string, lang: Lang): string {
  if (lang === "en") {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
  }
  const [h = 0, m = 0] = new Date(iso)
    .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Kolkata" })
    .split(":")
    .map(Number);
  const period = DAY_PERIODS[lang].find(([until]) => h < until)?.[1] ?? "";
  return `${period} ${h % 12 || 12}:${String(m).padStart(2, "0")}`;
}

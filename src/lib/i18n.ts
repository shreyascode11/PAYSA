import en from "../locales/en.json";
import hi from "../locales/hi.json";
import ta from "../locales/ta.json";
import { DEFAULT_LANG, LANG_COOKIE, LANG_LABELS, LANG_TAGS, isLang } from "./lang";
import type { Lang } from "./types";

export { DEFAULT_LANG, LANG_COOKIE, LANG_LABELS, LANG_TAGS, isLang };

type Dict = { [key: string]: string | Dict };

const DICTS: Record<Lang, Dict> = { en, ta, hi };

function lookup(dict: Dict, key: string): string | undefined {
  let node: string | Dict | undefined = dict;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

export type Vars = Record<string, string | number>;

export function interpolate(template: string, vars: Vars = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

/** Translate `key`; admin-only keys exist in English only, so other languages fall back to it. */
export function t(lang: Lang, key: string, vars?: Vars): string {
  const template = lookup(DICTS[lang], key) ?? lookup(DICTS.en, key) ?? key;
  return interpolate(template, vars);
}

export type Translator = (key: string, vars?: Vars) => string;
export const translator = (lang: Lang): Translator => (key, vars) => t(lang, key, vars);

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function formatHours(h: number): string {
  return (Math.round(h * 10) / 10).toString();
}

export function formatDay(dateKey: string, lang: Lang): string {
  return new Date(`${dateKey}T12:00:00Z`).toLocaleDateString(LANG_TAGS[lang], {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Flattened key list, used by tests to prove every language covers every worker string. */
export function flatKeys(dict: Dict, prefix = ""): string[] {
  return Object.entries(dict).flatMap(([k, v]) =>
    typeof v === "string" ? [`${prefix}${k}`] : flatKeys(v, `${prefix}${k}.`),
  );
}

export const dictionaries = DICTS;

/**
 * Report text for a reader: the original when it's already in their language, the English version for
 * English readers, otherwise the original (we only store an English translation).
 */
export function localizedReportText(r: { text: string; lang: Lang; textEn: string }, lang: Lang): { text: string; lang: Lang; translated: boolean } {
  if (r.lang === lang || !r.textEn || r.textEn === r.text) return { text: r.text, lang: r.lang, translated: false };
  if (lang === "en") return { text: r.textEn, lang: "en", translated: true };
  return { text: r.text, lang: r.lang, translated: false };
}

/** A notice in the worker's language when a translation exists, else the original. */
export function localizedNotice(n: { text: string; lang: Lang; translations?: Partial<Record<Lang, string>> }, lang: Lang): { text: string; lang: Lang } {
  const own = n.lang === lang ? n.text : n.translations?.[lang];
  return own ? { text: own, lang } : { text: n.text, lang: n.lang };
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

/** Date and time for the (English) admin dashboard, always in India Standard Time. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
}

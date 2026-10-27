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

export function formatTime(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleTimeString(LANG_TAGS[lang], { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

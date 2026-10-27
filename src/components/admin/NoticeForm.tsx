"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const LANGS = [
  ["en", "English"],
  ["ta", "Tamil"],
  ["hi", "Hindi"],
] as const;

const field = "rounded-3xl border border-navy-950/20 bg-ivory-50 p-3 text-navy-950";

/** Post a notice in one language, with optional hand-written versions in the others. */
export function NoticeForm({ orgId, autoTranslate }: { orgId: string; autoTranslate: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [lang, setLang] = useState<(typeof LANGS)[number][0]>("en");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const translations = Object.fromEntries(LANGS.filter(([l]) => l !== lang).map(([l]) => [l, String(f.get(`t_${l}`) ?? "")]));
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orgId, text: f.get("text"), lang, translations }),
    }).catch(() => null);
    const data = res?.ok ? ((await res.json()) as { languages: string[] }) : null;
    setMsg(data ? `Posted in ${data.languages.length} language${data.languages.length > 1 ? "s" : ""}. Workers see their own language and can listen to it.` : "Could not post.");
    if (data) {
      form.reset();
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-3xl border border-navy-950/10 bg-ivory-50 p-5 shadow-sm shadow-navy-950/5">
      <label className="flex flex-col gap-1 text-sm font-semibold text-navy-950">
        Written in
        <select value={lang} onChange={(e) => setLang(e.target.value as typeof lang)} className="min-h-11 max-w-xs rounded-full border border-navy-950/20 bg-ivory-50 px-4 text-navy-950">
          {LANGS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-navy-950">
        Notice (max 280 characters)
        <textarea name="text" required maxLength={280} rows={3} className={field} />
      </label>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-semibold text-navy-950">
          Other languages {autoTranslate ? "(optional, filled in automatically if left empty)" : "(optional; without these, workers see the original)"}
        </legend>
        {LANGS.filter(([l]) => l !== lang).map(([l, name]) => (
          <label key={l} className="flex flex-col gap-1 text-sm text-navy-950/70">
            {name}
            <textarea name={`t_${l}`} lang={l} maxLength={280} rows={2} className={field} />
          </label>
        ))}
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="flex min-h-11 items-center gap-2 rounded-full bg-navy-950 px-5 font-bold text-ivory-50">
          <Send aria-hidden="true" className="size-5" /> Post notice
        </button>
        <p role="status" className="text-sm font-semibold text-navy-950">
          {msg}
        </p>
      </div>
    </form>
  );
}

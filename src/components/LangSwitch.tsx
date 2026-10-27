"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LANG_COOKIE, LANG_LABELS, LANG_TAGS } from "@/lib/lang";
import type { Lang } from "@/lib/types";

const ORDER: Lang[] = ["en", "ta", "hi"];

export function LangSwitch({ current, label }: { current: Lang; label: string }) {
  const router = useRouter();
  const [lang, setLang] = useState(current);

  function choose(next: Lang) {
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = LANG_TAGS[next];
    setLang(next);
    router.refresh();
  }

  return (
    <div role="group" aria-label={label} className="flex rounded-xl border-2 border-line bg-surface p-0.5">
      {ORDER.map((l) => (
        <button
          key={l}
          type="button"
          lang={LANG_TAGS[l]}
          aria-pressed={lang === l}
          onClick={() => choose(l)}
          className={`min-h-11 min-w-12 rounded-lg px-2.5 text-base font-semibold ${
            lang === l ? "bg-brand text-brand-ink" : "text-ink"
          }`}
        >
          {LANG_LABELS[l]}
        </button>
      ))}
    </div>
  );
}

import { BedDouble, OctagonAlert } from "lucide-react";
import { formatHours, type Translator } from "@/lib/i18n";
import type { FatigueResult } from "@/lib/rules/fatigue";

const reasonText = (f: FatigueResult["factors"][number], t: Translator): string =>
  t(`fatigue.${f.code}`, { value: formatHours(f.value), limit: f.limit });

/** Rest reminder on the worker home. Critical = red fill + cream text; warning = yellow fill + ink text. */
export function FatigueBanner({ fatigue, t }: { fatigue: FatigueResult; t: Translator }) {
  if (fatigue.level === "ok") return null;
  const critical = fatigue.level === "critical";
  const Icon = critical ? OctagonAlert : BedDouble;
  return (
    <section aria-labelledby="fatigue-title" className={`flex gap-3 rounded-4xl p-5 ${critical ? "bg-critical text-cream-50" : "bg-warn text-ink-900"}`}>
      <Icon aria-hidden="true" className="size-9 shrink-0" />
      <div>
        <h2 id="fatigue-title" className="text-xl font-extrabold">
          {t(critical ? "fatigue.criticalTitle" : "fatigue.warnTitle")}
        </h2>
        <ul className="mt-1 font-semibold">
          {fatigue.factors.map((f) => (
            <li key={f.code}>{reasonText(f, t)}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function fatigueSpeech(fatigue: FatigueResult, t: Translator): string {
  if (fatigue.level === "ok") return "";
  const title = t(fatigue.level === "critical" ? "fatigue.criticalTitle" : "fatigue.warnTitle");
  return [title, ...fatigue.factors.map((f) => reasonText(f, t))].join(". ");
}

import { BedDouble, TriangleAlert } from "lucide-react";
import { formatHours, type Translator } from "@/lib/i18n";
import type { FatigueResult } from "@/lib/rules/fatigue";

/** Gentle rest reminder on the worker's home screen; reasons always carry the numbers. */
export function FatigueBanner({ fatigue, t }: { fatigue: FatigueResult; t: Translator }) {
  if (fatigue.level === "ok") return null;
  const critical = fatigue.level === "critical";
  const Icon = critical ? TriangleAlert : BedDouble;
  return (
    <section
      aria-labelledby="fatigue-title"
      className={`mb-5 flex gap-3 rounded-2xl border-2 p-4 ${critical ? "border-danger bg-danger-soft" : "border-warn bg-warn-soft"}`}
    >
      <Icon aria-hidden="true" className={`size-9 shrink-0 ${critical ? "text-danger" : "text-warn"}`} />
      <div>
        <h2 id="fatigue-title" className={`text-xl font-bold ${critical ? "text-danger" : "text-warn"}`}>
          {t(critical ? "fatigue.criticalTitle" : "fatigue.warnTitle")}
        </h2>
        <ul className="mt-1 text-ink">
          {fatigue.factors.map((f) => (
            <li key={f.code}>{t(`fatigue.${f.code}`, { value: formatHours(f.value), limit: f.limit })}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function fatigueSpeech(fatigue: FatigueResult, t: Translator): string {
  if (fatigue.level === "ok") return "";
  const title = t(fatigue.level === "critical" ? "fatigue.criticalTitle" : "fatigue.warnTitle");
  return [title, ...fatigue.factors.map((f) => t(`fatigue.${f.code}`, { value: formatHours(f.value), limit: f.limit }))].join(". ");
}

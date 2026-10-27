import { BedDouble, OctagonAlert } from "lucide-react";
import { formatHours, type Translator } from "@/lib/i18n";
import type { FatigueResult } from "@/lib/rules/fatigue";

const reasonText = (f: FatigueResult["factors"][number], t: Translator): string =>
  t(`fatigue.${f.code}`, { value: formatHours(f.value), limit: f.limit });

/** Rest reminder on the worker home. Critical = red fill + ivory text; warning = amber fill + navy text. */
export function FatigueBanner({ fatigue, t }: { fatigue: FatigueResult; t: Translator }) {
  if (fatigue.level === "ok") return null;
  const critical = fatigue.level === "critical";
  const Icon = critical ? OctagonAlert : BedDouble;
  return (
    <section aria-labelledby="fatigue-title" className={`flex gap-3 rounded-3xl p-4 ${critical ? "bg-critical text-ivory-50" : "bg-warn text-navy-950"}`}>
      <Icon aria-hidden="true" className="size-7 shrink-0" />
      <div>
        <h2 id="fatigue-title" className="text-base font-extrabold">
          {t(critical ? "fatigue.criticalTitle" : "fatigue.warnTitle")}
        </h2>
        <ul className="mt-1 text-sm font-medium">
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

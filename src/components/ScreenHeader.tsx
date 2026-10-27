import type { Lang } from "@/lib/types";
import { SpeakButton } from "./SpeakButton";

interface Props {
  title: string;
  speak: string;
  lang: Lang;
  listenLabel: string;
  stopLabel: string;
}

/** Page title plus the per-screen read-aloud button every worker screen must have. */
export function ScreenHeader({ title, speak, lang, listenLabel, stopLabel }: Props) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h1 className="text-xl font-extrabold leading-tight">{title}</h1>
      <SpeakButton text={speak} lang={lang} listenLabel={listenLabel} stopLabel={stopLabel} compact />
    </div>
  );
}

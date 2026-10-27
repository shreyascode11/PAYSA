import { Check, type LucideIcon } from "lucide-react";

export interface TimelineStep {
  key: string;
  label: string;
  Icon: LucideIcon;
  sublabel?: string;
}

interface Props {
  steps: TimelineStep[];
  /** Index of the step currently reached. */
  current: number;
  nowLabel: string;
  /** e.g. "Step 2 of 4", announced and shown under the progress bar. */
  progressLabel: string;
}

/** Horizontal step tracker: done = mint + check, current = orange + "Now", upcoming = hollow ring. */
export function Timeline({ steps, current, nowLabel, progressLabel }: Props) {
  const n = steps.length;
  const pct = n > 1 ? Math.round((current / (n - 1)) * 100) : 100;
  const inset = `${50 / n}%`;
  return (
    <div className="rounded-4xl bg-mint-100/8 p-4">
      <div className="relative">
        {/* Track and fill run between the first and last circle centres. */}
        <span aria-hidden="true" className="absolute top-6 h-1 rounded-full bg-cream-50/20" style={{ left: inset, right: inset }} />
        <span
          aria-hidden="true"
          className="absolute top-6 h-1 rounded-full bg-mint-100 transition-[width] duration-250"
          style={{ left: inset, width: `calc((100% - 2 * ${inset}) * ${pct / 100})` }}
        />
        <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {steps.map(({ key, label, Icon, sublabel }, i) => {
            const state = i < current ? "done" : i === current ? "current" : "todo";
            const circle =
              state === "done"
                ? "bg-mint-100 text-forest-900"
                : state === "current"
                  ? "bg-safety-500 text-ink-900 ring-4 ring-safety-500/30"
                  : "border-2 border-cream-50/45 bg-forest-900 text-cream-50/75";
            const StepIcon = state === "done" ? Check : Icon;
            return (
              <li key={key} aria-current={state === "current" ? "step" : undefined} className="flex flex-col items-center gap-1.5 text-center">
                <span className={`flex size-12 items-center justify-center rounded-full ${circle}`}>
                  <StepIcon aria-hidden="true" className="size-6" strokeWidth={2.5} />
                </span>
                <span className={`text-sm leading-tight ${state === "todo" ? "text-cream-50/75" : "font-bold text-cream-50"}`}>{label}</span>
                {state === "current" && (
                  <span className="rounded-full bg-safety-500 px-2 py-0.5 text-xs font-extrabold text-ink-900">{nowLabel}</span>
                )}
                {sublabel && <span className="text-xs text-cream-50/75">{sublabel}</span>}
              </li>
            );
          })}
        </ol>
      </div>
      <div className="mt-4">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={n}
          aria-valuenow={current + 1}
          aria-valuetext={progressLabel}
          className="h-2 overflow-hidden rounded-full bg-cream-50/15"
        >
          <span className="block h-full rounded-full bg-safety-500" style={{ width: `${Math.max(pct, 4)}%` }} />
        </div>
        <p className="mt-1.5 text-right text-sm font-bold text-cream-50/75">{progressLabel}</p>
      </div>
    </div>
  );
}

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

/** Horizontal step tracker: done = slate + check, current = sand + "Now", upcoming = hollow ring. */
export function Timeline({ steps, current, nowLabel, progressLabel }: Props) {
  const n = steps.length;
  const pct = n > 1 ? Math.round((current / (n - 1)) * 100) : 100;
  const inset = `${50 / n}%`;
  return (
    <div className="rounded-4xl bg-navy-900 p-4">
      <div className="relative">
        {/* Track and fill run between the first and last circle centres. */}
        <span aria-hidden="true" className="absolute top-6 h-1 rounded-full bg-ivory-50/20" style={{ left: inset, right: inset }} />
        <span
          aria-hidden="true"
          className="absolute top-6 h-1 rounded-full bg-slate-600 transition-[width] duration-250"
          style={{ left: inset, width: `calc((100% - 2 * ${inset}) * ${pct / 100})` }}
        />
        <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {steps.map(({ key, label, Icon, sublabel }, i) => {
            const state = i < current ? "done" : i === current ? "current" : "todo";
            const circle =
              state === "done"
                ? "bg-slate-600 text-ivory-50"
                : state === "current"
                  ? "bg-sand-300 text-navy-950 ring-4 ring-sand-300/30"
                  : "border-2 border-ivory-50/45 bg-navy-950 text-ivory-50/75";
            const StepIcon = state === "done" ? Check : Icon;
            return (
              <li key={key} aria-current={state === "current" ? "step" : undefined} className="flex flex-col items-center gap-1.5 text-center">
                <span className={`flex size-12 items-center justify-center rounded-full ${circle}`}>
                  <StepIcon aria-hidden="true" className="size-6" strokeWidth={2.5} />
                </span>
                <span className={`text-sm leading-tight ${state === "todo" ? "text-ivory-50/75" : "font-bold text-ivory-50"}`}>{label}</span>
                {state === "current" && (
                  <span className="rounded-full bg-sand-300 px-2 py-0.5 text-xs font-extrabold text-navy-950">{nowLabel}</span>
                )}
                {sublabel && <span className="text-xs text-ivory-50/75">{sublabel}</span>}
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
          className="h-2 overflow-hidden rounded-full bg-ivory-50/15"
        >
          <span className="block h-full rounded-full bg-sand-300" style={{ width: `${Math.max(pct, 4)}%` }} />
        </div>
        <p className="mt-1.5 text-right text-sm font-bold text-ivory-50/75">{progressLabel}</p>
      </div>
    </div>
  );
}

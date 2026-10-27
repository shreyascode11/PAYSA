import { CircleCheck, Eye, Inbox, Wrench } from "lucide-react";
import { REPORT_STATUSES, type ReportStatus } from "@/lib/types";

const ICONS = { received: Inbox, in_review: Eye, action_taken: Wrench, resolved: CircleCheck } as const;

/** Four-step progress shown as icons + words; reached steps are filled, the current one is announced. */
export function StatusTimeline({ status, labels }: { status: ReportStatus; labels: Record<ReportStatus, string> }) {
  const reached = REPORT_STATUSES.indexOf(status);
  return (
    <ol className="grid grid-cols-4 gap-1">
      {REPORT_STATUSES.map((s, i) => {
        const Icon = ICONS[s];
        const done = i <= reached;
        return (
          <li key={s} aria-current={i === reached ? "step" : undefined} className="flex flex-col items-center gap-1 text-center">
            <span
              className={`flex size-14 items-center justify-center rounded-full border-2 ${
                done ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface text-muted"
              }`}
            >
              <Icon aria-hidden="true" className="size-7" />
            </span>
            <span className={`text-sm leading-tight ${i === reached ? "font-extrabold" : done ? "font-semibold" : "text-muted"}`}>{labels[s]}</span>
          </li>
        );
      })}
    </ol>
  );
}

import { CircleCheck, Eye, Inbox, Wrench } from "lucide-react";
import type { ReportStatus } from "@/lib/types";

const STYLE: Record<ReportStatus, { cls: string; Icon: typeof Inbox }> = {
  received: { cls: "bg-info-soft text-info", Icon: Inbox },
  in_review: { cls: "bg-warn-soft text-warn", Icon: Eye },
  action_taken: { cls: "bg-brand-soft text-brand", Icon: Wrench },
  resolved: { cls: "bg-ok-soft text-ok", Icon: CircleCheck },
};

/** Status is always icon + text, never colour alone. */
export function StatusBadge({ status, label }: { status: ReportStatus; label: string }) {
  const { cls, Icon } = STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${cls}`}>
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </span>
  );
}

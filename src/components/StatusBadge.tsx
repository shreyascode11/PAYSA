import { CircleCheck, Eye, Inbox, Wrench } from "lucide-react";
import type { ReportStatus } from "@/lib/types";
import { StatusPill, type StatusTone } from "./ui/StatusPill";

const LOOK: Record<ReportStatus, { tone: StatusTone; icon: typeof Inbox }> = {
  received: { tone: "info", icon: Inbox },
  in_review: { tone: "warn", icon: Eye },
  action_taken: { tone: "info", icon: Wrench },
  resolved: { tone: "ok", icon: CircleCheck },
};

/** Report status as a StatusPill (icon + text, never colour alone). */
export function StatusBadge({ status, label }: { status: ReportStatus; label: string }) {
  return <StatusPill tone={LOOK[status].tone} icon={LOOK[status].icon} label={label} />;
}

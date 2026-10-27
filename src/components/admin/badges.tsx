import { CircleAlert, CircleCheck, Info, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import type { FatigueLevel } from "@/lib/rules/fatigue";
import type { RiskBand } from "@/lib/rules/attrition";
import type { ReportStatus, Severity } from "@/lib/types";

interface Look {
  label: string;
  cls: string;
  Icon: LucideIcon;
}

function Badge({ look }: { look: Look }) {
  const { label, cls, Icon } = look;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-semibold ${cls}`}>
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </span>
  );
}

export const SEVERITY: Record<Severity, Look> = {
  1: { label: "Low", cls: "bg-surface-2 text-ink", Icon: Info },
  2: { label: "Moderate", cls: "bg-info-soft text-info", Icon: CircleAlert },
  3: { label: "Serious", cls: "bg-warn-soft text-warn", Icon: TriangleAlert },
  4: { label: "Critical", cls: "bg-danger-soft text-danger", Icon: OctagonAlert },
};

export const FATIGUE: Record<FatigueLevel, Look> = {
  ok: { label: "OK", cls: "bg-ok-soft text-ok", Icon: CircleCheck },
  warn: { label: "Warning", cls: "bg-warn-soft text-warn", Icon: TriangleAlert },
  critical: { label: "Critical", cls: "bg-danger-soft text-danger", Icon: OctagonAlert },
};

export const RISK: Record<RiskBand, Look> = {
  low: { label: "Low", cls: "bg-ok-soft text-ok", Icon: CircleCheck },
  medium: { label: "Medium", cls: "bg-warn-soft text-warn", Icon: TriangleAlert },
  high: { label: "High", cls: "bg-danger-soft text-danger", Icon: OctagonAlert },
};

export const SeverityBadge = ({ severity }: { severity: Severity }) => <Badge look={SEVERITY[severity]} />;
export const FatigueBadge = ({ level }: { level: FatigueLevel }) => <Badge look={FATIGUE[level]} />;
export const RiskBadge = ({ band, score }: { band: RiskBand; score?: number }) => (
  <Badge look={{ ...RISK[band], label: score === undefined ? RISK[band].label : `${score} · ${RISK[band].label}` }} />
);

export const ACTION_LABELS: Record<string, string> = {
  one_on_one: "1-on-1 check-in",
  reduce_hours: "Reduce hours",
  check_pay: "Check pay delay",
  team_meeting: "Team meeting",
  buddy_checkin: "Buddy check-in",
};

export const REPORT_TYPE_LABELS: Record<string, string> = {
  hazard: "Hazard",
  grievance: "Grievance",
  manager_feedback: "Manager / conditions feedback",
};

export const humanize = (s: string): string => s.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());

export const STATUS_LABELS: Record<ReportStatus, string> = {
  received: "Received",
  in_review: "In review",
  action_taken: "Action taken",
  resolved: "Resolved",
};

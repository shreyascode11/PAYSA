import { StatusPill, type StatusTone } from "@/components/ui/StatusPill";
import type { RiskBand } from "@/lib/rules/attrition";
import type { FatigueLevel } from "@/lib/rules/fatigue";
import type { ReportStatus, Severity } from "@/lib/types";

interface Look {
  label: string;
  tone: StatusTone;
}

export const SEVERITY: Record<Severity, Look> = {
  1: { label: "Low", tone: "neutral" },
  2: { label: "Moderate", tone: "info" },
  3: { label: "Serious", tone: "warn" },
  4: { label: "Critical", tone: "critical" },
};

export const FATIGUE: Record<FatigueLevel, Look> = {
  ok: { label: "OK", tone: "ok" },
  warn: { label: "Warning", tone: "warn" },
  critical: { label: "Critical", tone: "critical" },
};

export const RISK: Record<RiskBand, Look> = {
  low: { label: "Low", tone: "ok" },
  medium: { label: "Medium", tone: "warn" },
  high: { label: "High", tone: "critical" },
};

export const SeverityBadge = ({ severity }: { severity: Severity }) => <StatusPill {...SEVERITY[severity]} />;
export const FatigueBadge = ({ level }: { level: FatigueLevel }) => <StatusPill {...FATIGUE[level]} />;
export const RiskBadge = ({ band, score }: { band: RiskBand; score?: number }) => (
  <StatusPill tone={RISK[band].tone} label={score === undefined ? RISK[band].label : `${score} · ${RISK[band].label}`} />
);

export const DRIVER_LABELS: Record<string, string> = {
  absences_up: "Absences rising",
  fatigue_days: "Fatigue alerts",
  long_weeks: "Weeks over 54h",
  late_pay: "Late or missed pay",
  low_team_mood: "Low team mood",
  new_joiner: "New joiner (under 90 days)",
  team_silent: "Team has gone silent",
};

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

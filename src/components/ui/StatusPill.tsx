import { Circle, CircleCheck, Info, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";

export type StatusTone = "ok" | "warn" | "critical" | "info" | "neutral";

// Fills paired with the only text colour that passes AA on them (CLAUDE.md §18.2).
const TONES: Record<StatusTone, { cls: string; Icon: LucideIcon }> = {
  ok: { cls: "bg-ok text-navy-950", Icon: CircleCheck },
  warn: { cls: "bg-warn text-navy-950", Icon: TriangleAlert },
  critical: { cls: "bg-critical text-ivory-50", Icon: OctagonAlert },
  info: { cls: "bg-sand-300 text-navy-950", Icon: Info },
  neutral: { cls: "ring-1 ring-inset ring-current/40", Icon: Circle },
};

interface Props {
  tone: StatusTone;
  label: string;
  icon?: LucideIcon;
  size?: "sm" | "md";
}

/** Status chip: always icon + text, never colour alone. */
export function StatusPill({ tone, label, icon, size = "sm" }: Props) {
  const { cls, Icon: DefaultIcon } = TONES[tone];
  const Icon = icon ?? DefaultIcon;
  const sizing = size === "md" ? "gap-2 px-3.5 py-1.5 text-base" : "gap-1.5 px-2.5 py-0.5 text-sm";
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full font-bold ${sizing} ${cls}`}>
      <Icon aria-hidden="true" className={size === "md" ? "size-5" : "size-4"} />
      {label}
    </span>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";

export type StatTone = "card" | "hero" | "light" | "dark";

const TONES: Record<StatTone, { box: string; label: string }> = {
  card: { box: "bg-navy-900 text-ivory-50 rounded-4xl", label: "text-ivory-50/75" },
  hero: { box: "bg-slate-600 text-ivory-50 rounded-4xl", label: "text-ivory-50/85" },
  light: { box: "bg-ivory-50 text-navy-950 rounded-2xl border border-navy-950/10", label: "text-navy-950/70" },
  dark: { box: "bg-navy-950 text-ivory-50 rounded-2xl", label: "text-ivory-50/75" },
};

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: StatTone;
  href?: string;
  size?: "md" | "lg";
  children?: ReactNode;
}

/** A label, one big number, and an optional hint: the basic unit of both dashboards. */
export function StatCard({ label, value, unit, hint, icon, tone = "card", href, size = "md", children }: Props) {
  const t = TONES[tone];
  const body = (
    <>
      <span className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${t.label} [&>svg]:size-5`}>
        {icon}
        {label}
      </span>
      <span className="mt-1 flex items-baseline gap-1.5">
        <span className={`tabular font-extrabold leading-none ${size === "lg" ? "text-5xl" : "text-3xl"}`}>{value}</span>
        {unit && <span className={`font-bold ${t.label}`}>{unit}</span>}
      </span>
      {hint && <span className={`mt-1.5 block text-sm ${t.label}`}>{hint}</span>}
      {children}
    </>
  );
  const cls = `block p-5 ${t.box}`;
  return href ? (
    <Link href={href} className={`${cls} transition hover:ring-2 hover:ring-current/30`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";

export type StatTone = "card" | "hero" | "light" | "dark";

const TONES: Record<StatTone, { box: string; label: string }> = {
  card: { box: "bg-mint-100/8 text-cream-50 rounded-4xl", label: "text-cream-50/75" },
  hero: { box: "bg-forest-700 text-cream-50 rounded-4xl", label: "text-cream-50/80" },
  light: { box: "bg-cream-50 text-ink-900 rounded-2xl border border-ink-900/10", label: "text-ink-900/70" },
  dark: { box: "bg-forest-900 text-cream-50 rounded-2xl", label: "text-cream-50/75" },
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
      <span className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wide ${t.label} [&>svg]:size-5`}>
        {icon}
        {label}
      </span>
      <span className="mt-1 flex items-baseline gap-1.5">
        <span className={`tabular font-extrabold leading-none ${size === "lg" ? "text-6xl" : "text-4xl"}`}>{value}</span>
        {unit && <span className={`font-bold ${t.label}`}>{unit}</span>}
      </span>
      {hint && <span className={`mt-2 block text-base ${t.label}`}>{hint}</span>}
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

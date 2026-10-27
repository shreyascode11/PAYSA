import type { ReactNode } from "react";

interface Props {
  value: number;
  max: number;
  /** Accessible description, e.g. "6 of 8 hours". */
  label: string;
  size?: number;
  stroke?: number;
  tone?: "dark" | "light";
  /** Arc colour: orange on dark/cream cards, ink when the card itself is orange. */
  arc?: "orange" | "ink";
  children?: ReactNode;
}

/** Timer-style progress ring with content in the middle. The arc is an orange fill; text inside never is. */
export function Ring({ value, max, label, size = 72, stroke = 7, tone = "dark", arc = "orange", children }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const track = tone === "dark" ? "color-mix(in srgb, var(--color-cream-50) 18%, transparent)" : "color-mix(in srgb, var(--color-ink-900) 14%, transparent)";
  return (
    <span role="img" aria-label={label} className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={arc === "orange" ? "var(--color-safety-500)" : "var(--color-ink-900)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          className="transition-[stroke-dashoffset] duration-250"
        />
      </svg>
      <span aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
        {children}
      </span>
    </span>
  );
}

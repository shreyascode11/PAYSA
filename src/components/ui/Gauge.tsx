import { StatusPill, type StatusTone } from "./StatusPill";

interface Props {
  value: number;
  label: string;
  bandLabel: string;
  band: Extract<StatusTone, "ok" | "warn" | "critical">;
  tone?: "light" | "dark";
  segments?: number;
}

const FILL: Record<Props["band"], string> = { ok: "var(--color-ok)", warn: "var(--color-warn)", critical: "var(--color-critical)" };

/** Semicircular segmented gauge (0–100). The number and a status pill carry the meaning; colour only reinforces it. */
export function Gauge({ value, label, bandLabel, band, tone = "light", segments = 24 }: Props) {
  const v = Math.max(0, Math.min(100, value));
  const lit = Math.round((v / 100) * segments);
  const empty = tone === "light" ? "color-mix(in srgb, var(--color-navy-950) 12%, transparent)" : "color-mix(in srgb, var(--color-ivory-50) 15%, transparent)";
  const cx = 100;
  const cy = 100;
  return (
    <figure role="img" aria-label={`${label}: ${v} of 100, ${bandLabel}`} className="flex flex-col items-center">
      <svg viewBox="0 0 200 112" className="w-full max-w-64" aria-hidden="true">
        {Array.from({ length: segments }, (_, i) => {
          // Spread segments across 180°, left to right.
          const angle = Math.PI - (Math.PI * (i + 0.5)) / segments;
          const x = cx + Math.cos(angle) * 78;
          const y = cy - Math.sin(angle) * 78;
          const deg = 90 - (angle * 180) / Math.PI;
          return (
            <rect
              key={i}
              x={x - 4}
              y={y - 14}
              width={8}
              height={28}
              rx={4}
              transform={`rotate(${deg} ${x} ${y})`}
              fill={i < lit ? FILL[band] : empty}
            />
          );
        })}
        <text x={cx} y={96} textAnchor="middle" className="tabular" style={{ font: "800 34px var(--font-sans)", fill: "currentColor" }}>
          {v}
        </text>
      </svg>
      <figcaption className="-mt-1 flex flex-col items-center gap-1.5">
        <span className="text-sm font-bold uppercase tracking-wide opacity-80">{label}</span>
        <StatusPill tone={band} label={bandLabel} />
      </figcaption>
    </figure>
  );
}

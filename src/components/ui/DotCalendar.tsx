import { OctagonAlert, TriangleAlert } from "lucide-react";

export type DotState = "worked" | "off" | "future" | "ok" | "warn" | "critical";

export interface Dot {
  key: string;
  state: DotState;
  /** Accessible name, e.g. "Mon 20 Oct: worked". */
  label: string;
}

export interface DotRow {
  key: string;
  label: string;
  sublabel?: string;
  dots: Dot[];
}

interface Props {
  rows: DotRow[];
  /** Screen-reader summary of the whole grid. */
  caption: string;
  columns?: string[];
  tone?: "dark" | "light";
  size?: "sm" | "md";
  /** Makes dots buttons. Only pass from a client component. */
  onSelect?: (rowKey: string, dotKey: string) => void;
  selected?: { row: string; dot: string } | null;
}

// Shape carries meaning as well as colour: filled, small, hollow, or an icon inside.
function dotClass(state: DotState, tone: "dark" | "light"): string {
  const dark = tone === "dark";
  switch (state) {
    case "worked":
      return "bg-safety-500";
    case "off":
      return `scale-50 ${dark ? "bg-cream-50/40" : "bg-ink-900/40"}`;
    case "future":
      return `border-2 ${dark ? "border-cream-50/45" : "border-ink-900/45"}`;
    case "ok":
      return "bg-ok";
    case "warn":
      return "bg-warn text-ink-900";
    case "critical":
      return "bg-critical text-cream-50";
  }
}

function DotMark({ state, tone }: { state: DotState; tone: "dark" | "light" }) {
  return (
    <span aria-hidden="true" className={`flex size-full items-center justify-center rounded-full ${dotClass(state, tone)}`}>
      {state === "warn" && <TriangleAlert className="size-[60%]" strokeWidth={2.75} />}
      {state === "critical" && <OctagonAlert className="size-[60%]" strokeWidth={2.75} />}
    </span>
  );
}

/** Dot grid (worker attendance streak, admin fatigue). Rendered as a table so it reads row by row. */
export function DotCalendar({ rows, caption, columns, tone = "dark", size = "md", onSelect, selected }: Props) {
  const cell = size === "md" ? "size-7" : "size-5";
  const sub = tone === "dark" ? "text-cream-50/75" : "text-ink-900/70";
  return (
    <table className="border-separate border-spacing-1">
      <caption className="sr-only">{caption}</caption>
      {columns && (
        <thead>
          <tr>
            <td />
            {columns.map((c, i) => (
              <th key={i} scope="col" className={`text-center text-xs font-bold ${sub}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            <th scope="row" className="whitespace-nowrap pr-2 text-left align-middle text-sm font-bold">
              {row.label}
              {row.sublabel && <span className={`block text-xs font-normal ${sub}`}>{row.sublabel}</span>}
            </th>
            {row.dots.map((d) => {
              const isSel = selected?.row === row.key && selected.dot === d.key;
              return (
                <td key={d.key} className="p-0">
                  {onSelect ? (
                    <button
                      type="button"
                      aria-label={d.label}
                      aria-pressed={isSel}
                      onClick={() => onSelect(row.key, d.key)}
                      className={`block ${cell} rounded-full p-0.5 ${isSel ? "outline outline-3 outline-[var(--focus)]" : ""}`}
                    >
                      <DotMark state={d.state} tone={tone} />
                    </button>
                  ) : (
                    <span role="img" aria-label={d.label} className={`block ${cell} p-0.5`}>
                      <DotMark state={d.state} tone={tone} />
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

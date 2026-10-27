export interface ChartSeries {
  key: string;
  label: string;
  /** Fill class for the mark, e.g. "bg-forest-700". */
  fill: string;
}

export interface ChartColumn {
  key: string;
  label: string;
  values: Record<string, number>;
  /** "low" columns are hatched (e.g. rest days); "highlight" uses the orange fill for single-series charts. */
  kind?: "normal" | "low" | "highlight";
}

interface Props {
  title: string;
  series: ChartSeries[];
  columns: ChartColumn[];
  format: (v: number) => string;
  /** Upper bound of the y-axis; defaults to a clean round number above the tallest column. */
  max?: number;
  ticks?: number;
  /** Draws a labelled reference line at the mean column total. */
  showAverage?: boolean;
  /** Label the last column's total directly (selective direct labelling). */
  labelLast?: boolean;
  height?: string;
}

const HATCH = "bg-[repeating-linear-gradient(135deg,color-mix(in_srgb,var(--color-ink-900)_45%,transparent)_0_1.5px,transparent_1.5px_6px)] ring-1 ring-inset ring-ink-900/30";

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * mag >= v / 4) ?? 10;
  return Math.ceil(v / (step * mag)) * step * mag;
}

/**
 * Server-rendered column chart (no client JS): y-axis with clean ticks, hairline gridlines,
 * bars ≤ 28px with rounded tops and 2px gaps between stacked segments, focusable columns with
 * tooltips, a legend for 2+ series, and a table view of the same numbers.
 */
export function ColumnChart({ title, series, columns, format, max, ticks = 4, showAverage = false, labelLast = false, height = "h-64" }: Props) {
  const total = (c: ChartColumn) => series.reduce((a, s) => a + (c.values[s.key] ?? 0), 0);
  const top = max ?? niceMax(Math.max(...columns.map(total)));
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) => (top / ticks) * i);
  const avg = columns.length ? columns.reduce((a, c) => a + total(c), 0) / columns.length : 0;
  const pct = (v: number) => `${Math.min(100, (v / top) * 100)}%`;
  const single = series.length === 1;

  return (
    <figure className="m-0">
      {!single && (
        <ul className="mb-3 flex flex-wrap gap-4 text-sm text-ink-900/70" aria-label="Legend">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={`inline-block size-3 rounded-sm ${s.fill}`} />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex gap-2">
        <div aria-hidden="true" className={`relative w-10 shrink-0 ${height}`}>
          {tickValues.map((v) => (
            <span key={v} className="tabular absolute right-0 -translate-y-1/2 text-[11px] text-ink-900/70" style={{ bottom: pct(v) }}>
              {format(v)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`relative ${height}`}>
            {tickValues.map((v) => (
              <span key={v} aria-hidden="true" className="absolute inset-x-0 h-px bg-ink-900/10" style={{ bottom: pct(v) }} />
            ))}
            {showAverage && (
              <span aria-hidden="true" className="absolute inset-x-0 z-[1] h-0.5 bg-ink-900/60" style={{ bottom: pct(avg) }}>
                <span className="absolute -top-5 left-0 rounded bg-ink-900 px-1.5 py-0.5 text-[11px] font-bold text-cream-50">avg {format(avg)}</span>
              </span>
            )}
            <ul className="relative flex h-full items-end gap-1.5" aria-label={title}>
              {columns.map((c, i) => {
                const sum = total(c);
                const summary = single ? format(sum) : series.map((s) => `${s.label} ${format(c.values[s.key] ?? 0)}`).join(", ");
                return (
                  <li key={c.key} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                    <span tabIndex={0} aria-label={`${c.label}: ${summary}`} className="flex w-full max-w-7 flex-col-reverse gap-[2px] rounded-t-md outline-offset-2" style={{ height: pct(sum) }}>
                      {series.map((s, si) => {
                        const v = c.values[s.key] ?? 0;
                        if (v <= 0) return null;
                        const fill = c.kind === "low" ? HATCH : c.kind === "highlight" && single ? "bg-safety-500" : s.fill;
                        const isTop = si === series.length - 1 || series.slice(si + 1).every((n) => (c.values[n.key] ?? 0) <= 0);
                        return <span key={s.key} className={`block w-full ${fill} ${isTop ? "rounded-t-md" : ""}`} style={{ height: `${(v / sum) * 100}%` }} />;
                      })}
                    </span>
                    {labelLast && i === columns.length - 1 && (
                      <span aria-hidden="true" className="tabular absolute text-xs font-extrabold text-ink-900" style={{ bottom: `calc(${pct(sum)} + 4px)` }}>
                        {format(sum)}
                      </span>
                    )}
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full z-10 mb-2 hidden whitespace-nowrap rounded-xl bg-ink-900 px-3 py-2 text-xs font-semibold text-cream-50 shadow-lg group-focus-within:block group-hover:block"
                    >
                      <span className="block font-extrabold">{c.label}</span>
                      {single ? format(sum) : series.map((s) => <span key={s.key} className="block">{`${s.label}: ${format(c.values[s.key] ?? 0)}`}</span>)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div aria-hidden="true" className="mt-1.5 flex gap-1.5 border-t border-ink-900/20 pt-1.5">
            {columns.map((c, i) => (
              <span key={c.key} className="flex-1 truncate text-center text-[11px] text-ink-900/70">
                {columns.length <= 8 || i % 2 === 0 || i === columns.length - 1 ? c.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-bold text-forest-700">Show as table</summary>
        <table className="mt-2 w-full text-sm">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="text-left text-ink-900/70">
              <th scope="col">Period</th>
              {series.map((s) => (
                <th key={s.key} scope="col">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {columns.map((c) => (
              <tr key={c.key} className="border-t border-ink-900/10">
                <th scope="row" className="py-1 text-left font-normal">
                  {c.label}
                </th>
                {series.map((s) => (
                  <td key={s.key} className="tabular">
                    {format(c.values[s.key] ?? 0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

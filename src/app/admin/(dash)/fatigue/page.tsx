import { OctagonAlert, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { FatigueHeatmap } from "@/components/admin/FatigueHeatmap";
import { adminPageContext } from "@/lib/admin-context";
import { getRepo } from "@/lib/repo";
import { fatigueGrid, loadOrgData } from "@/lib/services/admin";

export const metadata: Metadata = { title: "Fatigue" };

const LEVEL_ORDER = { critical: 0, warn: 1, ok: 2 } as const;

export default async function Fatigue() {
  const { org } = await adminPageContext();
  const repo = getRepo();
  const data = await loadOrgData(repo, org.id);
  if (!data) return null;
  const grid = await fatigueGrid(repo, data);
  const worst = (cells: (typeof grid.rows)[number]["cells"]) =>
    Math.min(...cells.map((c) => LEVEL_ORDER[c.result.level]));
  const rows = [...grid.rows]
    .sort((a, b) => worst(a.cells) - worst(b.cells) || a.worker.name.localeCompare(b.worker.name))
    .map((r) => ({
      workerId: r.worker.id,
      name: r.worker.name,
      role: r.worker.role,
      cells: r.cells.map((c) => ({ date: c.date, hours: c.hours, level: c.result.level, reasons: c.result.reasons, actions: c.actions.map((a) => a.action) })),
    }));
  const dates = grid.dates.map((d) => ({ key: d, label: new Date(`${d}T12:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "numeric", timeZone: "UTC" }) }));

  return (
    <>
      <h1 className="mb-1 text-3xl font-extrabold">Fatigue, last 14 days</h1>
      <p className="mb-3 text-muted">
        Warning: shift &gt; 10h, rest &lt; 11h, &gt; 6 days in a row, or &gt; 54h/week. Critical: shift &gt; 12h, rest &lt; 8h, or &gt; 60h/week.
      </p>
      <ul aria-label="Legend" className="mb-4 flex flex-wrap gap-4 text-sm">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="flex size-6 items-center justify-center rounded bg-ok-soft text-xs font-bold text-ok">8</span> OK (hours shown)
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="flex size-6 items-center justify-center rounded bg-warn-soft text-warn ring-1 ring-inset ring-warn">
            <TriangleAlert className="size-4" />
          </span>
          Warning
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="flex size-6 items-center justify-center rounded bg-danger text-danger-ink">
            <OctagonAlert className="size-4" />
          </span>
          Critical
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="flex size-6 items-center justify-center rounded bg-surface-2 text-muted">–</span> Day off
        </li>
      </ul>
      <FatigueHeatmap rows={rows} dates={dates} />
    </>
  );
}

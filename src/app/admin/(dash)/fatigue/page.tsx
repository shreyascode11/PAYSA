import type { Metadata } from "next";
import { FatigueHeatmap } from "@/components/admin/FatigueHeatmap";
import { StatCard } from "@/components/ui/StatCard";
import { adminPageContext } from "@/lib/admin-context";
import { getRepo } from "@/lib/repo";
import { fatigueGrid, loadOrgData } from "@/lib/services/admin";

export const metadata: Metadata = { title: "Fatigue" };

const LEVEL_ORDER = { critical: 0, warn: 1, ok: 2 } as const;

function LegendDot({ cls, label, icon }: { cls: string; label: string; icon?: string }) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden="true" className={`flex size-5 items-center justify-center rounded-full text-[10px] font-black ${cls}`}>
        {icon}
      </span>
      {label}
    </li>
  );
}

export default async function Fatigue() {
  const { org } = await adminPageContext();
  const repo = getRepo();
  const data = await loadOrgData(repo, org.id);
  if (!data) return null;
  const grid = await fatigueGrid(repo, data);
  const worst = (cells: (typeof grid.rows)[number]["cells"]) => Math.min(...cells.map((c) => LEVEL_ORDER[c.result.level]));
  const rows = [...grid.rows]
    .sort((a, b) => worst(a.cells) - worst(b.cells) || a.worker.name.localeCompare(b.worker.name))
    .map((r) => ({
      workerId: r.worker.id,
      name: r.worker.name,
      role: r.worker.role,
      cells: r.cells.map((c) => ({ date: c.date, hours: c.hours, level: c.result.level, reasons: c.result.reasons, actions: c.actions.map((a) => a.action) })),
    }));
  const dates = grid.dates.map((d) => ({ key: d, label: new Date(`${d}T12:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", timeZone: "UTC" }) }));
  const cells = grid.rows.flatMap((r) => r.cells);
  const count = (lvl: "warn" | "critical") => grid.rows.filter((r) => r.cells.some((c) => c.result.level === lvl)).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-ink-900">Fatigue, last 14 days</h1>
        <p className="max-w-3xl text-ink-900/70">
          Warning: shift over 10h, rest under 11h, more than 6 days in a row, or over 54h a week. Critical: shift over 12h, rest under 8h, or over 60h a week.
        </p>
      </div>
      <section aria-label="Fatigue summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard tone="dark" label="Critical workers" value={count("critical")} hint="at least one critical day" />
        <StatCard tone="light" label="Warning workers" value={count("warn")} hint="at least one warning day" />
        <StatCard tone="light" label="Critical days" value={cells.filter((c) => c.result.level === "critical").length} hint={`of ${cells.filter((c) => c.hours > 0).length} worked days`} />
        <StatCard tone="light" label="Actions logged" value={cells.reduce((a, c) => a + c.actions.length, 0)} hint="rest, swaps, talks" />
      </section>
      <ul aria-label="Legend" className="flex flex-wrap gap-5 text-sm text-ink-900">
        <LegendDot cls="bg-ok" label="OK" />
        <LegendDot cls="bg-warn text-ink-900" icon="!" label="Warning" />
        <LegendDot cls="bg-critical text-cream-50" icon="×" label="Critical" />
        <LegendDot cls="scale-50 bg-ink-900/40" label="Day off" />
      </ul>
      <FatigueHeatmap rows={rows} dates={dates} />
    </div>
  );
}

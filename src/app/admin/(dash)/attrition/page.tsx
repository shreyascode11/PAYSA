import { CircleCheck, OctagonAlert, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ACTION_LABELS, DRIVER_LABELS, RiskBadge } from "@/components/admin/badges";
import { Gauge } from "@/components/ui/Gauge";
import { StatCard } from "@/components/ui/StatCard";
import { adminPageContext } from "@/lib/admin-context";
import { bandFor, type RiskBand } from "@/lib/rules/attrition";
import { getRepo } from "@/lib/repo";
import { attritionTable, loadOrgData } from "@/lib/services/admin";

export const metadata: Metadata = { title: "Quit risk" };

const TILE: Record<RiskBand, { cls: string; Icon: typeof CircleCheck; word: string; tone: "ok" | "warn" | "critical" }> = {
  low: { cls: "bg-ok text-ink-900", Icon: CircleCheck, word: "Low", tone: "ok" },
  medium: { cls: "bg-warn text-ink-900", Icon: TriangleAlert, word: "Medium", tone: "warn" },
  high: { cls: "bg-critical text-cream-50", Icon: OctagonAlert, word: "High", tone: "critical" },
};
const card = "rounded-3xl border border-ink-900/10 bg-cream-50 p-5 shadow-sm shadow-ink-900/5";

export default async function Attrition() {
  const { org } = await adminPageContext();
  const repo = getRepo();
  const data = await loadOrgData(repo, org.id);
  if (!data) return null;
  const rows = await attritionTable(repo, data);
  const teamName = new Map(org.teams.map((t) => [t.id, t.name]));
  const avg = rows.length ? Math.round(rows.reduce((a, r) => a + r.result.score, 0) / rows.length) : 0;
  const avgBand = TILE[bandFor(avg)];
  const n = (b: RiskBand) => rows.filter((r) => r.result.band === b).length;
  // Which drivers matter most across the org: the "why" behind the average.
  const driverTotals = new Map<string, { label: string; count: number }>();
  for (const r of rows) for (const d of r.result.drivers) {
    const cur = driverTotals.get(d.code) ?? { label: DRIVER_LABELS[d.code] ?? d.code, count: 0 };
    driverTotals.set(d.code, { ...cur, count: cur.count + 1 });
  }
  const topDrivers = [...driverTotals.values()].sort((a, b) => b.count - a.count).slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-ink-900">Quit risk</h1>
        <p className="max-w-3xl text-ink-900/70">
          An explainable 0–100 score per worker from the last 14 days against their own baseline. Anonymous reports are never used, and every score shows why.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="g-h" className={`${card} flex flex-col items-center justify-center text-ink-900`}>
          <h2 id="g-h" className="sr-only">
            Average quit risk
          </h2>
          <Gauge value={avg} label="Average risk" bandLabel={avgBand.word} band={avgBand.tone} />
        </section>
        <section aria-label="Workers by risk band" className="grid grid-cols-3 gap-4 lg:col-span-2 lg:grid-cols-3">
          <StatCard tone="dark" label="High" value={n("high")} hint="score 60+" />
          <StatCard tone="light" label="Medium" value={n("medium")} hint="score 30–59" />
          <StatCard tone="light" label="Low" value={n("low")} hint="score under 30" />
          <div className={`${card} col-span-3`}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-900/70">Most common reasons</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {topDrivers.map((d) => (
                <li key={d.label} className="flex items-center justify-between gap-3 rounded-2xl bg-mint-100/60 px-4 py-2.5 text-ink-900">
                  <span className="font-semibold">{d.label}</span>
                  <span className="tabular font-extrabold">
                    {d.count} <span className="text-sm font-semibold text-ink-900/70">workers</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <section aria-labelledby="tiles-h" className={card}>
        <h2 id="tiles-h" className="mb-1 text-lg font-extrabold text-ink-900">
          Risk map
        </h2>
        <p className="mb-4 text-sm text-ink-900/70">One tile per worker, highest risk first. Each tile shows the score, an icon and the band.</p>
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
          {rows.map(({ worker, result }) => {
            const tile = TILE[result.band];
            return (
              <li key={worker.id}>
                <Link
                  href={`/admin/workers/${worker.id}`}
                  aria-label={`${worker.name}: ${result.score}, ${tile.word} risk`}
                  className={`flex min-h-24 flex-col justify-between rounded-2xl p-3 transition hover:-translate-y-0.5 hover:shadow-md ${tile.cls}`}
                >
                  <span className="flex items-center justify-between gap-1">
                    <span className="tabular text-2xl font-black">{result.score}</span>
                    <tile.Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="truncate text-sm font-bold">{worker.name}</span>
                  <span className="text-xs font-semibold">{tile.word}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="tbl-h" className={card}>
        <h2 id="tbl-h" className="mb-3 text-lg font-extrabold text-ink-900">
          Why, and what to do
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Workers sorted by quit-risk score, with the top two reasons and a suggested action</caption>
            <thead className="text-ink-900/70">
              <tr>
                <th scope="col" className="py-2 pr-3">Worker</th>
                <th scope="col" className="py-2 pr-3">Score</th>
                <th scope="col" className="py-2 pr-3">Top reasons</th>
                <th scope="col" className="py-2">Suggested action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ worker, result }) => {
                const top = result.drivers.slice(0, 2);
                return (
                  <tr key={worker.id} className="border-t border-ink-900/10 align-top">
                    <th scope="row" className="py-3 pr-3 text-left">
                      <Link href={`/admin/workers/${worker.id}`} className="font-bold text-ink-900 hover:underline">
                        {worker.name}
                      </Link>
                      <span className="block font-normal text-ink-900/70">
                        {worker.role} · {teamName.get(worker.teamId)}
                      </span>
                    </th>
                    <td className="py-3 pr-3">
                      <RiskBadge band={result.band} score={result.score} />
                    </td>
                    <td className="py-3 pr-3 text-ink-900">
                      {top.length === 0 ? (
                        <span className="text-ink-900/70">No risk signals</span>
                      ) : (
                        <ul className="flex flex-col gap-0.5">
                          {top.map((d) => (
                            <li key={d.code}>
                              {d.detail} <span className="text-ink-900/70">(+{d.points})</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="py-3 font-semibold text-ink-900">{top[0] ? ACTION_LABELS[top[0].action] : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

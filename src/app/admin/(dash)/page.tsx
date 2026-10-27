import { ArrowUpRight, Clock, Flame, HardHat, Inbox, OctagonAlert, TrendingDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FatigueBadge, RiskBadge, SEVERITY, humanize } from "@/components/admin/badges";
import { ColumnChart } from "@/components/ui/ColumnChart";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { adminPageContext } from "@/lib/admin-context";
import { formatDay } from "@/lib/i18n";
import { getRepo } from "@/lib/repo";
import { loadOrgData, overview } from "@/lib/services/admin";
import type { Severity } from "@/lib/types";

export const metadata: Metadata = { title: "Overview" };

const FATIGUE_RANK = { ok: 0, warn: 1, critical: 2 } as const;
const card = "rounded-3xl border border-ink-900/10 bg-cream-50 p-5 shadow-sm shadow-ink-900/5";

export default async function Overview() {
  const { org } = await adminPageContext();
  const repo = getRepo();
  const data = await loadOrgData(repo, org.id);
  if (!data) return null;
  const ov = await overview(repo, data);
  const openTotal = Object.values(ov.openBySeverity).reduce((a, n) => a + n, 0);
  const lastIdx = ov.attendance.length - 1;
  const attendanceCols = ov.attendance.map((a, i) => ({
    key: a.date,
    label: formatDay(a.date, "en"),
    values: { rate: a.rate },
    // Rest days are hatched rather than coloured, so a quiet Sunday isn't read as a problem.
    kind: i === lastIdx ? ("highlight" as const) : a.rate < 40 ? ("low" as const) : ("normal" as const),
  }));
  const hoursCols = ov.weeks.map((w) => ({
    key: w.weekStart,
    label: formatDay(w.weekStart, "en"),
    values: { regular: w.regular, overtime: w.overtime },
  }));
  const lastWeek = ov.weeks.at(-2);
  const otShare = lastWeek && lastWeek.regular + lastWeek.overtime > 0 ? Math.round((lastWeek.overtime / (lastWeek.regular + lastWeek.overtime)) * 100) : 0;
  const people = [...ov.people]
    .sort((a, b) => b.risk.score - a.risk.score || FATIGUE_RANK[b.fatigue] - FATIGUE_RANK[a.fatigue])
    .slice(0, 8);
  const teamName = new Map(org.teams.map((t) => [t.id, t.name]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-ink-900">Dashboard</h1>
        <p className="text-ink-900/70">Attendance, safety and wellbeing across {data.sites.length} sites.</p>
      </div>

      {ov.criticalReports.length > 0 && (
        <section aria-labelledby="crit" role="alert" className="rounded-2xl bg-critical p-5 text-cream-50">
          <h2 id="crit" className="flex items-center gap-2 text-lg font-extrabold">
            <OctagonAlert aria-hidden="true" className="size-6" />
            {ov.criticalReports.length} critical report{ov.criticalReports.length > 1 ? "s need" : " needs"} action now
          </h2>
          <ul className="mt-2 flex flex-col gap-1">
            {ov.criticalReports.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/reports/${r.id}`} className="font-semibold underline underline-offset-2">
                  {humanize(r.category)}: {r.textEn.slice(0, 110)}
                  {r.textEn.length > 110 ? "…" : ""}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard tone="dark" icon={<HardHat aria-hidden="true" />} label="On site now" value={ov.onSiteNow} unit={`/ ${ov.workforce}`} hint="checked in right now" />
        <StatCard tone="light" icon={<Inbox aria-hidden="true" />} label="Open reports" value={openTotal} hint={`${ov.openBySeverity[4]} critical`} href="/admin/reports?status=open" />
        <StatCard
          tone="light"
          icon={<Clock aria-hidden="true" />}
          label="Avg resolution"
          value={ov.avgResolutionHours === null ? "—" : Math.round(ov.avgResolutionHours)}
          unit={ov.avgResolutionHours === null ? undefined : "h"}
          hint="report → resolved"
        />
        <StatCard tone="light" icon={<Flame aria-hidden="true" />} label="Fatigue critical" value={ov.fatigueCritical} hint="workers, last 7 days" href="/admin/fatigue" />
        <StatCard tone="light" icon={<TrendingDown aria-hidden="true" />} label="High quit risk" value={ov.highRisk} hint="score 60 or more" href="/admin/attrition" />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <section aria-labelledby="att" className={card}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="att" className="text-lg font-extrabold text-ink-900">
                  Attendance, last 14 days
                </h2>
                <p className="text-sm text-ink-900/70">Share of workers who checked in each day</p>
              </div>
              <ul className="flex gap-4 text-sm text-ink-900/70" aria-label="Legend">
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="inline-block size-3 rounded-sm bg-forest-700" /> Attendance
                </li>
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="inline-block size-3 rounded-sm bg-safety-500" /> Today so far
                </li>
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="inline-block size-3 rounded-sm bg-[repeating-linear-gradient(135deg,var(--color-ink-900)_0_1.5px,transparent_1.5px_5px)] opacity-60" /> Rest day
                </li>
              </ul>
            </div>
            <ColumnChart
              title="Daily attendance, last 14 days"
              series={[{ key: "rate", label: "Attendance", fill: "bg-forest-700" }]}
              columns={attendanceCols}
              max={100}
              format={(v) => `${Math.round(v)}%`}
              showAverage
            />
          </section>

          <section aria-labelledby="hrs" className={card}>
            <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="hrs" className="text-lg font-extrabold text-ink-900">
                  Hours worked per week
                </h2>
                <p className="text-sm text-ink-900/70">Regular vs overtime, all workers · overtime is paid at 2×</p>
              </div>
              <StatusPill tone={otShare >= 20 ? "critical" : otShare >= 10 ? "warn" : "ok"} label={`Last week: ${otShare}% overtime`} />
            </div>
            <ColumnChart
              title="Regular and overtime hours per week, last 6 weeks"
              series={[
                { key: "regular", label: "Regular hours", fill: "bg-forest-700" },
                { key: "overtime", label: "Overtime hours", fill: "bg-safety-500" },
              ]}
              columns={hoursCols}
              format={(v) => `${Math.round(v)}h`}
              labelLast
              height="h-56"
            />
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="sev" className={card}>
            <h2 id="sev" className="mb-3 text-lg font-extrabold text-ink-900">
              Open reports by severity
            </h2>
            <ul className="flex flex-col gap-2.5">
              {([4, 3, 2, 1] as Severity[]).map((s) => (
                <li key={s}>
                  <Link href={`/admin/reports?severity=${s}&status=open`} className="flex items-center justify-between rounded-lg hover:bg-mint-100/60">
                    <StatusPill tone={SEVERITY[s].tone} label={SEVERITY[s].label} />
                    <span className="tabular text-xl font-extrabold text-ink-900">{ov.openBySeverity[s]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="pulse" className={card}>
            <h2 id="pulse" className="text-lg font-extrabold text-ink-900">
              Team mood
            </h2>
            <p className="mb-3 text-sm text-ink-900/70">Anonymous weekly pulse · shown only with 5+ responses</p>
            <ul className="flex flex-col gap-2.5">
              {ov.teamPulse.map((tp) => (
                <li key={tp.teamId} className="flex items-center justify-between gap-2">
                  <span className="text-ink-900">{tp.name}</span>
                  {tp.average === null ? (
                    <StatusPill tone="neutral" label="Not enough responses" />
                  ) : (
                    <StatusPill tone={tp.average <= 2 ? "critical" : tp.average < 3 ? "warn" : "ok"} label={`${tp.average.toFixed(1)} / 5 · ${tp.responses} answers`} />
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section aria-labelledby="team" className={card}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="team" className="text-lg font-extrabold text-ink-900">
            Team: needs attention first
          </h2>
          <Link href="/admin/workers" className="flex min-h-10 items-center gap-1 rounded-full border border-ink-900/20 px-4 text-sm font-bold text-forest-700">
            All workers <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Workers sorted by quit risk, with today&apos;s status and fatigue</caption>
            <thead className="text-ink-900/70">
              <tr>
                <th scope="col" className="py-2 pr-3">Worker</th>
                <th scope="col" className="py-2 pr-3">Today</th>
                <th scope="col" className="py-2 pr-3">Fatigue (7 days)</th>
                <th scope="col" className="py-2 pr-3">Quit risk</th>
                <th scope="col" className="py-2">Top reason</th>
              </tr>
            </thead>
            <tbody>
              {people.map(({ worker, onSite, fatigue, risk }) => (
                <tr key={worker.id} className="border-t border-ink-900/10">
                  <th scope="row" className="py-3 pr-3 text-left">
                    <span className="flex items-center gap-3">
                      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mint-100 text-sm font-extrabold text-forest-900">
                        {worker.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                      </span>
                      <span>
                        <Link href={`/admin/workers/${worker.id}`} className="font-bold text-ink-900 hover:underline">
                          {worker.name}
                        </Link>
                        <span className="block font-normal text-ink-900/70">
                          {worker.role} · {teamName.get(worker.teamId)}
                        </span>
                      </span>
                    </span>
                  </th>
                  <td className="py-3 pr-3">{onSite ? <StatusPill tone="ok" label="On site" /> : <StatusPill tone="neutral" label="Not in" />}</td>
                  <td className="py-3 pr-3">
                    <FatigueBadge level={fatigue} />
                  </td>
                  <td className="py-3 pr-3">
                    <RiskBadge band={risk.band} score={risk.score} />
                  </td>
                  <td className="py-3 text-ink-900">{risk.drivers[0]?.detail ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

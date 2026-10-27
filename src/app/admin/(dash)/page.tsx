import { Clock, Flame, HardHat, Inbox, OctagonAlert, TrendingDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SEVERITY, humanize } from "@/components/admin/badges";
import { TeamTable } from "@/components/admin/TeamTable";
import { ColumnChart } from "@/components/ui/ColumnChart";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { adminPageContext } from "@/lib/admin-context";
import { formatDay } from "@/lib/i18n";
import { getRepo } from "@/lib/repo";
import { loadOrgData, overview } from "@/lib/services/admin";
import type { Severity } from "@/lib/types";
import { panelPadded } from "@/components/admin/styles";

export const metadata: Metadata = { title: "Overview" };

const SEVERITY_ORDER: readonly Severity[] = [4, 3, 2, 1];

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-950">Dashboard</h1>
        <p className="text-navy-950/70">Attendance, safety and wellbeing across {data.sites.length} sites.</p>
      </div>

      {ov.criticalReports.length > 0 && (
        <section aria-labelledby="crit" role="alert" className="rounded-2xl bg-critical p-5 text-ivory-50">
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
          <section aria-labelledby="att" className={panelPadded}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="att" className="text-lg font-extrabold text-navy-950">
                  Attendance, last 14 days
                </h2>
                <p className="text-sm text-navy-950/70">Share of workers who checked in each day</p>
              </div>
              <ul className="flex gap-4 text-sm text-navy-950/70" aria-label="Legend">
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="inline-block size-3 rounded-sm bg-slate-600" /> Attendance
                </li>
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="inline-block size-3 rounded-sm bg-navy-950" /> Today so far
                </li>
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="inline-block size-3 rounded-sm bg-[repeating-linear-gradient(135deg,var(--color-navy-950)_0_1.5px,transparent_1.5px_5px)] opacity-60" /> Rest day
                </li>
              </ul>
            </div>
            <ColumnChart
              title="Daily attendance, last 14 days"
              series={[{ key: "rate", label: "Attendance", fill: "bg-slate-600" }]}
              columns={attendanceCols}
              max={100}
              format={(v) => `${Math.round(v)}%`}
              showAverage
            />
          </section>

          <section aria-labelledby="hrs" className={panelPadded}>
            <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="hrs" className="text-lg font-extrabold text-navy-950">
                  Hours worked per week
                </h2>
                <p className="text-sm text-navy-950/70">Regular vs overtime, all workers · overtime is paid at 2×</p>
              </div>
              <StatusPill tone={otShare >= 20 ? "critical" : otShare >= 10 ? "warn" : "ok"} label={`Last week: ${otShare}% overtime`} />
            </div>
            <ColumnChart
              title="Regular and overtime hours per week, last 6 weeks"
              series={[
                { key: "regular", label: "Regular hours", fill: "bg-slate-600" },
                { key: "overtime", label: "Overtime hours", fill: "bg-sage-500" },
              ]}
              columns={hoursCols}
              format={(v) => `${Math.round(v)}h`}
              labelLast
              height="h-56"
            />
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="sev" className={panelPadded}>
            <h2 id="sev" className="mb-3 text-lg font-extrabold text-navy-950">
              Open reports by severity
            </h2>
            <ul className="flex flex-col gap-2.5">
              {SEVERITY_ORDER.map((s) => (
                <li key={s}>
                  <Link href={`/admin/reports?severity=${s}&status=open`} className="flex items-center justify-between rounded-lg hover:bg-sand-300/40">
                    <StatusPill tone={SEVERITY[s].tone} label={SEVERITY[s].label} />
                    <span className="tabular text-xl font-extrabold text-navy-950">{ov.openBySeverity[s]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="pulse" className={panelPadded}>
            <h2 id="pulse" className="text-lg font-extrabold text-navy-950">
              Team mood
            </h2>
            <p className="mb-3 text-sm text-navy-950/70">Anonymous weekly pulse · shown only with 5+ responses</p>
            <ul className="flex flex-col gap-2.5">
              {ov.teamPulse.map((tp) => (
                <li key={tp.teamId} className="flex items-center justify-between gap-2">
                  <span className="text-navy-950">{tp.name}</span>
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

      <TeamTable people={ov.people} teams={org.teams} />
    </div>
  );
}

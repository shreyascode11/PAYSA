import { Clock, Flame, HardHat, Inbox, OctagonAlert, TrendingDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AttendanceChartLazy } from "@/components/admin/AttendanceChartLazy";
import { SEVERITY, SeverityBadge, humanize } from "@/components/admin/badges";
import { adminPageContext } from "@/lib/admin-context";
import { formatDay } from "@/lib/i18n";
import { getRepo } from "@/lib/repo";
import { loadOrgData, overview } from "@/lib/services/admin";
import type { Severity } from "@/lib/types";

export const metadata: Metadata = { title: "Overview" };

function Kpi({ icon, label, value, hint, href }: { icon: React.ReactNode; label: string; value: string; hint?: string; href?: string }) {
  const body = (
    <>
      <span className="flex items-center gap-2 text-sm font-semibold text-muted [&>svg]:size-5">
        {icon}
        {label}
      </span>
      <span className="mt-1 block text-3xl font-extrabold">{value}</span>
      {hint && <span className="text-sm text-muted">{hint}</span>}
    </>
  );
  const cls = "block rounded-2xl bg-surface p-4 shadow-sm";
  return href ? (
    <Link href={href} className={`${cls} hover:ring-2 hover:ring-brand`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default async function Overview() {
  const { org } = await adminPageContext();
  const repo = getRepo();
  const data = await loadOrgData(repo, org.id);
  if (!data) return null;
  const ov = await overview(repo, data);
  const chartData = ov.attendance.map((a) => ({ label: formatDay(a.date, "en"), rate: a.rate, present: a.present }));
  const openTotal = Object.values(ov.openBySeverity).reduce((a, n) => a + n, 0);

  return (
    <>
      <h1 className="mb-1 text-3xl font-extrabold">{org.name}</h1>
      <p className="mb-6 text-muted">Overview · {data.workers.length} workers · {data.sites.length} sites</p>

      {ov.criticalReports.length > 0 && (
        <section aria-labelledby="crit" role="alert" className="mb-6 rounded-2xl border-2 border-danger bg-danger-soft p-4">
          <h2 id="crit" className="flex items-center gap-2 text-lg font-extrabold text-danger">
            <OctagonAlert aria-hidden="true" className="size-6" />
            {ov.criticalReports.length} critical report{ov.criticalReports.length > 1 ? "s" : ""} need action now
          </h2>
          <ul className="mt-2 flex flex-col gap-1">
            {ov.criticalReports.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/reports/${r.id}`} className="font-semibold text-ink underline">
                  {humanize(r.category)}: {r.textEn.slice(0, 110)}
                  {r.textEn.length > 110 ? "…" : ""}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Key numbers" className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi icon={<HardHat aria-hidden="true" />} label="On site now" value={String(ov.onSiteNow)} hint={`of ${ov.workforce}`} />
        <Kpi icon={<Inbox aria-hidden="true" />} label="Open reports" value={String(openTotal)} href="/admin/reports" />
        <Kpi
          icon={<Clock aria-hidden="true" />}
          label="Avg resolution"
          value={ov.avgResolutionHours === null ? "—" : `${Math.round(ov.avgResolutionHours)}h`}
          hint="report → resolved"
        />
        <Kpi icon={<Flame aria-hidden="true" />} label="Fatigue critical" value={String(ov.fatigueCritical)} hint="workers, last 7 days" href="/admin/fatigue" />
        <Kpi icon={<TrendingDown aria-hidden="true" />} label="High quit risk" value={String(ov.highRisk)} hint="score ≥ 60" href="/admin/attrition" />
        <Kpi
          icon={<OctagonAlert aria-hidden="true" />}
          label="Critical open"
          value={String(ov.openBySeverity[4])}
          hint="severity 4"
          href="/admin/reports?severity=4"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section aria-labelledby="att" className="rounded-2xl bg-surface p-4 shadow-sm xl:col-span-2">
          <h2 id="att" className="text-lg font-bold">
            Attendance, last 14 days
          </h2>
          <p className="mb-2 text-sm text-muted">Share of workers who checked in each day</p>
          <AttendanceChartLazy data={chartData} />
          <details className="mt-2">
            <summary className="cursor-pointer font-semibold text-brand">Show as table</summary>
            <table className="mt-2 w-full text-sm">
              <caption className="sr-only">Daily attendance</caption>
              <thead>
                <tr className="text-left text-muted">
                  <th scope="col">Day</th>
                  <th scope="col">Present</th>
                  <th scope="col">Rate</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((d) => (
                  <tr key={d.label} className="border-t border-line">
                    <th scope="row" className="py-1 text-left font-normal">
                      {d.label}
                    </th>
                    <td>{d.present}</td>
                    <td>{d.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="sev" className="rounded-2xl bg-surface p-4 shadow-sm">
            <h2 id="sev" className="mb-3 text-lg font-bold">
              Open reports by severity
            </h2>
            <ul className="flex flex-col gap-2">
              {([4, 3, 2, 1] as Severity[]).map((s) => (
                <li key={s} className="flex items-center justify-between">
                  <Link href={`/admin/reports?severity=${s}`} className="rounded" aria-label={`${SEVERITY[s].label}: ${ov.openBySeverity[s]} open`}>
                    <SeverityBadge severity={s} />
                  </Link>
                  <span className="text-xl font-bold">{ov.openBySeverity[s]}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="pulse" className="rounded-2xl bg-surface p-4 shadow-sm">
            <h2 id="pulse" className="text-lg font-bold">
              Team mood (anonymous pulse)
            </h2>
            <p className="mb-3 text-sm text-muted">Last 2 weeks · shown only with 5+ responses</p>
            <ul className="flex flex-col gap-2">
              {ov.teamPulse.map((tp) => (
                <li key={tp.teamId} className="flex items-center justify-between gap-2">
                  <span>{tp.name}</span>
                  {tp.average === null ? (
                    <span className="text-sm italic text-muted">Not enough responses</span>
                  ) : (
                    <span className={`font-bold ${tp.average <= 2 ? "text-danger" : ""}`}>
                      {tp.average.toFixed(1)} / 5 <span className="text-sm font-normal text-muted">({tp.responses})</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

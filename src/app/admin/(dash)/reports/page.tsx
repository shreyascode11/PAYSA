import { EyeOff, Filter, ImageIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { REPORT_TYPE_LABELS, STATUS_LABELS, SeverityBadge, humanize } from "@/components/admin/badges";
import { StatusBadge } from "@/components/StatusBadge";
import { adminPageContext } from "@/lib/admin-context";
import { getRepo } from "@/lib/repo";
import { REPORT_STATUSES } from "@/lib/types";

export const metadata: Metadata = { title: "Reports" };

interface Filters {
  type?: string;
  severity?: string;
  status?: string;
  site?: string;
}

export default async function Reports({ searchParams }: { searchParams: Promise<Filters> }) {
  const { org } = await adminPageContext();
  const f = await searchParams;
  const repo = getRepo();
  const [reports, sites, workers] = await Promise.all([repo.listReports(org.id), repo.listSites(org.id), repo.listWorkers(org.id)]);
  const siteName = new Map(sites.map((s) => [s.id, s.name]));
  const workerName = new Map(workers.map((w) => [w.id, w.name]));
  const rows = reports
    .filter(
      (r) =>
        (!f.type || r.type === f.type) &&
        (!f.severity || String(r.severity) === f.severity) &&
        (!f.status || (f.status === "open" ? r.status !== "resolved" : r.status === f.status)) &&
        (!f.site || r.siteId === f.site),
    )
    .sort((a, b) => b.severity - a.severity || b.createdAt.localeCompare(a.createdAt));

  const sel = "min-h-11 rounded-lg border-2 border-line bg-surface px-2 text-ink";
  return (
    <>
      <h1 className="mb-4 text-3xl font-extrabold">Reports inbox</h1>
      <form method="get" className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl bg-surface p-3" aria-label="Filter reports">
        <label className="flex flex-col text-sm font-semibold">
          Type
          <select name="type" defaultValue={f.type ?? ""} className={sel}>
            <option value="">All</option>
            {Object.entries(REPORT_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm font-semibold">
          Severity
          <select name="severity" defaultValue={f.severity ?? ""} className={sel}>
            <option value="">All</option>
            {[4, 3, 2, 1].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm font-semibold">
          Status
          <select name="status" defaultValue={f.status ?? ""} className={sel}>
            <option value="">All</option>
            <option value="open">Open (not resolved)</option>
            {REPORT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm font-semibold">
          Site
          <select name="site" defaultValue={f.site ?? ""} className={sel}>
            <option value="">All</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 font-bold text-brand-ink">
          <Filter aria-hidden="true" className="size-5" />
          Apply
        </button>
        <Link href="/admin/reports" className="min-h-11 content-center px-2 font-semibold text-brand underline">
          Clear
        </Link>
      </form>

      <p className="mb-2 text-sm text-muted" aria-live="polite">
        {rows.length} report{rows.length === 1 ? "" : "s"}
      </p>
      <div className="overflow-x-auto rounded-2xl bg-surface shadow-sm">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Reports, most severe first</caption>
          <thead className="text-muted">
            <tr>
              <th scope="col" className="p-3">Severity</th>
              <th scope="col" className="p-3">Report</th>
              <th scope="col" className="p-3">Site</th>
              <th scope="col" className="p-3">Status</th>
              <th scope="col" className="p-3">From</th>
              <th scope="col" className="p-3">Received</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line align-top">
                <td className="p-3">
                  <SeverityBadge severity={r.severity} />
                </td>
                <td className="max-w-md p-3">
                  <Link href={`/admin/reports/${r.id}`} className="font-bold text-brand underline">
                    {REPORT_TYPE_LABELS[r.type]} · {humanize(r.category)}
                  </Link>
                  <p className="line-clamp-2 text-ink">{r.textEn}</p>
                  {r.photoUrl && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <ImageIcon aria-hidden="true" className="size-3.5" /> Photo attached
                    </span>
                  )}
                </td>
                <td className="p-3">{(r.siteId && siteName.get(r.siteId)) ?? "—"}</td>
                <td className="p-3">
                  <StatusBadge status={r.status} label={STATUS_LABELS[r.status]} />
                </td>
                <td className="p-3">
                  {r.anonymous ? (
                    <span className="inline-flex items-center gap-1 text-muted">
                      <EyeOff aria-hidden="true" className="size-4" /> Anonymous
                    </span>
                  ) : (
                    (r.workerId && workerName.get(r.workerId)) ?? "—"
                  )}
                </td>
                <td className="whitespace-nowrap p-3">{new Date(r.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

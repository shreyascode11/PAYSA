import { ArrowLeft, EyeOff, Languages, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { REPORT_TYPE_LABELS, STATUS_LABELS, SeverityBadge, humanize } from "@/components/admin/badges";
import { ReportAdminForm } from "@/components/admin/ReportAdminForm";
import { ReplyForm } from "@/components/ReplyForm";
import { StatusBadge } from "@/components/StatusBadge";
import { adminPageContext } from "@/lib/admin-context";
import { getRepo } from "@/lib/repo";
import { categoriesFor } from "@/lib/sectors";
import { panelPadded } from "@/components/admin/styles";
import { formatDateTime } from "@/lib/i18n";

export const metadata: Metadata = { title: "Report" };


export default async function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const { org } = await adminPageContext();
  const repo = getRepo();
  const report = await repo.getReport((await params).id);
  if (!report || report.orgId !== org.id) notFound();
  const [site, worker] = await Promise.all([
    report.siteId ? repo.getSite(report.siteId) : undefined,
    report.workerId ? repo.getWorker(report.workerId) : undefined,
  ]);

  return (
    <>
      <Link href="/admin/reports" className="mb-4 inline-flex min-h-11 items-center gap-1 font-semibold text-slate-600">
        <ArrowLeft aria-hidden="true" className="size-5" /> All reports
      </Link>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">
          {REPORT_TYPE_LABELS[report.type]} · {humanize(report.category)}
        </h1>
        <SeverityBadge severity={report.severity} />
        <StatusBadge status={report.status} label={STATUS_LABELS[report.status]} />
      </div>
      <p className="mb-6 flex flex-wrap gap-x-4 gap-y-1 text-sm text-navy-950/70">
        <span>Tracking {report.trackingId}</span>
        <span>{site?.name ?? "No site"}</span>
        <span>Received {formatDateTime(report.createdAt)}{report.anonymous && " (rounded to the hour)"}</span>
        {report.anonymous ? (
          <span className="inline-flex items-center gap-1">
            <EyeOff aria-hidden="true" className="size-4" /> Anonymous: identity not stored
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <UserRound aria-hidden="true" className="size-4" /> {worker?.name ?? "Unknown"} ({worker?.role})
          </span>
        )}
      </p>

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="content" className={`${panelPadded}`}>
          <h2 id="content" className="mb-2 text-lg font-bold">
            What the worker said
          </h2>
          <p className="text-lg">{report.textEn}</p>
          {report.langOriginal !== "en" && (
            <div className="mt-3 rounded-xl bg-sand-300/40 p-3">
              <p className="mb-1 flex items-center gap-1 text-sm font-semibold text-navy-950/70">
                <Languages aria-hidden="true" className="size-4" /> Original ({report.langOriginal === "ta" ? "Tamil" : "Hindi"})
              </p>
              <p lang={report.langOriginal}>{report.textOriginal}</p>
            </div>
          )}
          {report.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- metadata-stripped data URL stored with the report
            <img src={report.photoUrl} alt="Photo attached by the worker" className="mt-3 max-h-80 rounded-xl object-contain" />
          )}
          <h3 className="mb-2 mt-6 font-bold">Timeline</h3>
          <ol className="flex flex-col gap-2 border-l-2 border-navy-950/15 pl-4">
            {report.updates.map((u, i) => (
              <li key={i}>
                <StatusBadge status={u.status} label={STATUS_LABELS[u.status]} /> <span className="text-sm text-navy-950/70">{formatDateTime(u.at)}</span>
                {u.note && <p className="mt-1">{u.note}</p>}
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="update" className={`${panelPadded}`}>
            <h2 id="update" className="mb-3 text-lg font-bold">
              Update status
            </h2>
            <ReportAdminForm
              reportId={report.id}
              status={report.status}
              severity={report.severity}
              category={report.category}
              categories={categoriesFor(report.type, org.sector).map((c) => ({ id: c, label: humanize(c) }))}
            />
          </section>

          <section aria-labelledby="chat" className={`${panelPadded}`}>
            <h2 id="chat" className="text-lg font-bold">
              {report.anonymous ? "Anonymous follow-up chat" : "Messages"}
            </h2>
            <p className="mb-3 text-sm text-navy-950/70">The worker sees these by entering their tracking code. Their identity is never revealed to you.</p>
            <ul className="mb-4 flex flex-col gap-2">
              {report.messages.length === 0 && <li className="text-navy-950/70">No messages yet.</li>}
              {report.messages.map((m, i) => (
                <li key={i} className={`max-w-[85%] rounded-3xl p-4 ${m.from === "admin" ? "self-end bg-sand-300/40" : "self-start bg-sand-300/40"}`}>
                  <p className="text-xs font-bold">
                    {m.from === "admin" ? "You (HR)" : "Worker"} · <span className="font-normal text-navy-950/70">{formatDateTime(m.at)}</span>
                  </p>
                  <p>{m.text}</p>
                </li>
              ))}
            </ul>
            <ReplyForm tone="light" endpoint={`/api/admin/reports/${report.id}/message`} label="Ask a follow-up question" submit="Send" errorText="Could not send. Try again." />
          </section>
        </div>
      </div>
    </>
  );
}

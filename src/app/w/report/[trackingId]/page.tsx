import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { ReplyForm } from "@/components/ReplyForm";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatusTimeline } from "@/components/StatusTimeline";
import { TrackForm } from "@/components/TrackForm";
import { categoryIcon } from "@/components/categoryIcons";
import { formatTime, formatDay } from "@/lib/i18n";
import { getT } from "@/lib/locale";
import { getRepo } from "@/lib/repo";
import { TRACKING_ID_PATTERN, normalizeTrackingId } from "@/lib/rules/anonymity";
import { toPublicReport } from "@/lib/services/reports";
import { localDateKey } from "@/lib/time";
import { REPORT_STATUSES } from "@/lib/types";

export const metadata: Metadata = { title: "Report status", robots: { index: false } };

/** Public: anyone holding the code can follow the report, so nothing here identifies the reporter. */
export default async function TrackReport({ params }: { params: Promise<{ trackingId: string }> }) {
  const id = normalizeTrackingId(decodeURIComponent((await params).trackingId));
  const raw = TRACKING_ID_PATTERN.test(id) ? await getRepo().findReportByTracking(id) : undefined;
  const report = raw && toPublicReport(raw);
  const { lang, t } = await getT();
  const statusLabels = Object.fromEntries(REPORT_STATUSES.map((s) => [s, t(`track.status.${s}`)])) as Record<(typeof REPORT_STATUSES)[number], string>;
  const when = (iso: string) => `${formatDay(localDateKey(iso), lang)} ${formatTime(iso, lang)}`;

  if (!report) {
    return (
      <main id="main" className="flex-1 px-4 py-6">
        <ScreenHeader title={t("track.title")} speak={t("track.notFound")} lang={lang} listenLabel={t("common.listen")} stopLabel={t("common.stop")} />
        <p role="alert" className="mb-6 rounded-2xl bg-danger-soft p-4 font-semibold text-danger">
          {t("track.notFound")}
        </p>
        <TrackForm label={t("track.enter")} button={t("track.check")} defaultValue={id} />
      </main>
    );
  }

  const Icon = categoryIcon(report.category);
  const latestNote = [...report.updates].reverse().find((u) => u.note)?.note;
  return (
    <main id="main" className="flex-1 px-4 py-6">
      <ScreenHeader
        title={t("track.title")}
        speak={t("track.speak", { status: statusLabels[report.status] })}
        lang={lang}
        listenLabel={t("common.listen")}
        stopLabel={t("common.stop")}
      />
      <p className="mb-4 flex items-center gap-3">
        <Icon aria-hidden="true" className="size-8 text-brand" />
        <span>
          <span className="block font-mono text-xl font-extrabold tracking-widest">{report.trackingId}</span>
          <span className="text-muted">{t(`report.cat.${report.category}`)}</span>
        </span>
      </p>

      <div aria-live="polite">
        <StatusTimeline status={report.status} labels={statusLabels} />
      </div>
      {latestNote && <p className="mt-4 rounded-xl bg-brand-soft p-3" lang="en">{latestNote}</p>}

      <blockquote className="mt-4 rounded-xl border-l-4 border-line bg-surface p-3 text-muted">{report.text}</blockquote>

      <section aria-labelledby="msgs" className="mt-8">
        <h2 id="msgs" className="mb-3 text-xl font-bold">
          {t("track.messages")}
        </h2>
        {report.messages.length === 0 ? (
          <p className="text-muted">{t("track.noMessages")}</p>
        ) : (
          <ul className="mb-4 flex flex-col gap-3">
            {report.messages.map((m, i) => (
              <li key={i} className={`max-w-[85%] rounded-2xl p-3 ${m.from === "admin" ? "self-start bg-surface" : "self-end bg-brand-soft"}`}>
                <p className="text-sm font-bold">
                  {m.from === "admin" ? t("track.fromAdmin") : t("track.fromYou")} · <span className="font-normal text-muted">{when(m.at)}</span>
                </p>
                <p>{m.text}</p>
              </li>
            ))}
          </ul>
        )}
        <ReplyForm endpoint={`/api/reports/track/${report.trackingId}/message`} label={t("track.reply")} submit={t("track.replySend")} errorText={t("common.error")} />
        <p className="mt-4 flex items-start gap-2 text-base text-muted">
          <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-ok" />
          {t("track.anonymousNote")}
        </p>
      </section>
    </main>
  );
}

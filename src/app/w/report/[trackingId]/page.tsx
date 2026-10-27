import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { ReplyForm } from "@/components/ReplyForm";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Timeline } from "@/components/ui/Timeline";
import { CircleCheck, Eye, Inbox, Wrench } from "lucide-react";
import { TrackForm } from "@/components/TrackForm";
import { categoryIcon } from "@/components/categoryIcons";
import { formatTime, formatDay } from "@/lib/i18n";
import { getT } from "@/lib/locale";
import { getRepo } from "@/lib/repo";
import { TRACKING_ID_PATTERN, normalizeTrackingId } from "@/lib/rules/anonymity";
import { toPublicReport } from "@/lib/services/reports";
import { localDateKey } from "@/lib/time";
import { REPORT_STATUSES } from "@/lib/types";

const STEP_ICONS = { received: Inbox, in_review: Eye, action_taken: Wrench, resolved: CircleCheck } as const;

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
        <p role="alert" className="mb-6 rounded-3xl bg-critical p-4 font-bold text-cream-50">
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
        <span className="flex size-12 items-center justify-center rounded-full bg-safety-500 text-ink-900"><Icon aria-hidden="true" className="size-6" /></span>
        <span>
          <span className="block font-mono text-xl font-extrabold tracking-widest">{report.trackingId}</span>
          <span className="text-muted">{t(`report.cat.${report.category}`)}</span>
        </span>
      </p>

      <div aria-live="polite">
        <Timeline
          current={REPORT_STATUSES.indexOf(report.status)}
          nowLabel={t("common.now")}
          progressLabel={t("track.stepOf", { n: REPORT_STATUSES.indexOf(report.status) + 1 })}
          steps={REPORT_STATUSES.map((s) => ({ key: s, label: statusLabels[s], Icon: STEP_ICONS[s] }))}
        />
      </div>
      {latestNote && (
        <p className="mt-4 rounded-3xl bg-mint-100 p-4 font-semibold text-ink-900" lang="en">
          {latestNote}
        </p>
      )}

      <blockquote className="mt-4 rounded-3xl border-l-4 border-safety-500 bg-mint-100/8 p-4 text-cream-50/90">{report.text}</blockquote>

      <section aria-labelledby="msgs" className="mt-8">
        <h2 id="msgs" className="mb-3 text-xl font-bold">
          {t("track.messages")}
        </h2>
        {report.messages.length === 0 ? (
          <p className="text-muted">{t("track.noMessages")}</p>
        ) : (
          <ul className="mb-4 flex flex-col gap-3">
            {report.messages.map((m, i) => (
              <li key={i} className={`max-w-[85%] rounded-3xl p-4 ${m.from === "admin" ? "glass-dark self-start rounded-bl-md" : "self-end rounded-br-md bg-mint-100 text-ink-900"}`}>
                <p className="text-sm font-bold">
                  {m.from === "admin" ? t("track.fromAdmin") : t("track.fromYou")} · <span className="font-normal opacity-80">{when(m.at)}</span>
                </p>
                <p>{m.text}</p>
              </li>
            ))}
          </ul>
        )}
        <ReplyForm endpoint={`/api/reports/track/${report.trackingId}/message`} label={t("track.reply")} submit={t("track.replySend")} errorText={t("common.error")} />
        <p className="mt-4 flex items-start gap-2 text-base text-muted">
          <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-mint-100" />
          {t("track.anonymousNote")}
        </p>
      </section>
    </main>
  );
}

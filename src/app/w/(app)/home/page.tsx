import { CirclePlay, CircleStop, Megaphone } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BigButton } from "@/components/BigButton";
import { FatigueBanner, fatigueSpeech } from "@/components/FatigueBanner";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SpeakButton } from "@/components/SpeakButton";
import { requireWorkerPage } from "@/lib/auth";
import { formatHours, formatTime } from "@/lib/i18n";
import { getT } from "@/lib/locale";
import { getRepo } from "@/lib/repo";
import { loadWorker, workerSummary } from "@/lib/services/worker";

export const metadata: Metadata = { title: "Home" };

export default async function WorkerHome() {
  const session = await requireWorkerPage();
  const repo = getRepo();
  const ctx = await loadWorker(repo, session.sub);
  if (!ctx) notFound();
  const { lang, t } = await getT();
  const [summary, notices] = await Promise.all([workerSummary(repo, ctx), repo.listAnnouncements(ctx.org.id)]);
  const firstName = ctx.worker.name.split(" ")[0] ?? ctx.worker.name;
  const stats = [
    { label: t("home.today"), value: summary.todayHours },
    { label: t("home.week"), value: summary.weekHours },
    { label: t("home.ot"), value: summary.weekOtHours },
  ];
  const speech = [
    t("home.speak", {
      name: firstName,
      today: formatHours(summary.todayHours),
      week: formatHours(summary.weekHours),
      ot: formatHours(summary.weekOtHours),
    }),
    fatigueSpeech(summary.fatigue, t),
  ].join(" ");

  return (
    <>
      <ScreenHeader title={t("home.hello", { name: firstName })} speak={speech} lang={lang} listenLabel={t("common.listen")} stopLabel={t("common.stop")} />
      <FatigueBanner fatigue={summary.fatigue} t={t} />

      <p className="mb-3 flex items-center gap-2 font-semibold">
        <span aria-hidden="true" className={`inline-block size-3 rounded-full ${summary.openShift ? "bg-ok" : "bg-muted"}`} />
        {summary.openShift ? t("home.atWork", { time: formatTime(summary.openShift.checkIn, lang) }) : t("home.notAtWork")}
      </p>

      <dl className="mb-6 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-surface p-3 text-center shadow-sm">
            <dt className="text-base text-muted">{s.label}</dt>
            <dd className="text-3xl font-extrabold">{t("common.hoursShort", { hours: formatHours(s.value) })}</dd>
          </div>
        ))}
      </dl>

      {summary.openShift ? (
        <BigButton href="/w/checkin" tone="danger" icon={<CircleStop />} label={t("home.endWork")} />
      ) : (
        <BigButton href="/w/checkin" icon={<CirclePlay />} label={t("home.startWork")} />
      )}

      <section aria-labelledby="notices" className="mt-8">
        <h2 id="notices" className="mb-3 flex items-center gap-2 text-xl font-bold">
          <Megaphone aria-hidden="true" className="size-6 text-brand" />
          {t("home.notices")}
        </h2>
        {notices.length === 0 ? (
          <p className="text-muted">{t("home.noNotices")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {notices.slice(0, 3).map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-3 rounded-2xl border-l-4 border-brand bg-surface p-4">
                <p lang={n.lang}>{n.text}</p>
                <SpeakButton text={n.text} lang={n.lang} listenLabel={t("common.listen")} stopLabel={t("common.stop")} compact />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

import { ChevronRight, CirclePlay, CircleStop, Megaphone, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FatigueBanner, fatigueSpeech } from "@/components/FatigueBanner";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SpeakButton } from "@/components/SpeakButton";
import { BigButton } from "@/components/ui/BigButton";
import { DotCalendar } from "@/components/ui/DotCalendar";
import { Ring } from "@/components/ui/Ring";
import { StatusPill } from "@/components/ui/StatusPill";
import { requireWorkerPage } from "@/lib/auth";
import { LANG_TAGS, formatDay, formatHours, formatTime, localizedNotice } from "@/lib/i18n";
import { getT } from "@/lib/locale";
import { getRepo } from "@/lib/repo";
import { sectorConfig } from "@/lib/sectors";
import { loadWorker, workerStreak, workerSummary } from "@/lib/services/worker";
import type { Lang } from "@/lib/types";

export const metadata: Metadata = { title: "Home" };

/** Narrow Mon–Sun names in the worker's language (1 Jan 2024 was a Monday). */
const weekdays = (lang: Lang): string[] =>
  Array.from({ length: 7 }, (_, i) =>
    new Date(Date.UTC(2024, 0, 1 + i)).toLocaleDateString(LANG_TAGS[lang], { weekday: "narrow", timeZone: "UTC" }),
  );

function Legend({ items }: { items: { cls: string; label: string }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-ivory-50/75">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`inline-block size-3 rounded-full ${i.cls}`} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export default async function WorkerHome() {
  const session = await requireWorkerPage();
  const repo = getRepo();
  const ctx = await loadWorker(repo, session.sub);
  if (!ctx) notFound();
  const { lang, t } = await getT();
  const [summary, streak, notices] = await Promise.all([
    workerSummary(repo, ctx),
    workerStreak(repo, ctx.worker.id),
    repo.listAnnouncements(ctx.org.id),
  ]);
  const firstName = ctx.worker.name.split(" ")[0] ?? ctx.worker.name;
  const goal = sectorConfig(ctx.org.sector).standardDailyHours;
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
    <div className="flex flex-col gap-5">
      <div>
        <ScreenHeader title={t("home.hello", { name: firstName })} speak={speech} lang={lang} listenLabel={t("common.listen")} stopLabel={t("common.stop")} />
        <div className="-mt-2">
          {summary.openShift ? (
            <StatusPill tone="ok" size="md" label={t("home.atWork", { time: formatTime(summary.openShift.checkIn, lang) })} />
          ) : (
            <StatusPill tone="neutral" size="md" label={t("home.notAtWork")} />
          )}
        </div>
      </div>

      <section aria-labelledby="week-h" className="flex items-end justify-between gap-4 pt-2">
        <div>
          <h2 id="week-h" className="text-xs font-bold uppercase tracking-wider text-ivory-50/75">
            {t("home.weekHours")}
          </h2>
          <p className="tabular mt-1 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold leading-none">{formatHours(summary.weekHours)}</span>
            <span className="text-xl font-bold text-ivory-50/75">h</span>
          </p>
          <p className="mt-2 font-bold text-sand-300">{t("home.otLine", { hours: formatHours(summary.weekOtHours) })}</p>
        </div>
        <Ring
          value={summary.todayHours}
          max={goal}
          size={80}
          stroke={8}
          label={t("home.todayGoal", { hours: formatHours(summary.todayHours), goal })}
        >
          <span className="tabular text-xl font-extrabold">{formatHours(summary.todayHours)}</span>
          <span className="mt-1 text-xs font-bold text-ivory-50/75">{t("home.today")}</span>
        </Ring>
      </section>

      <FatigueBanner fatigue={summary.fatigue} t={t} />

      {summary.openShift ? (
        <BigButton href="/w/checkin" icon={<CircleStop />} label={t("home.endWork")} />
      ) : (
        <BigButton href="/w/checkin" icon={<CirclePlay />} label={t("home.startWork")} />
      )}

      <section aria-labelledby="streak-h" className="rounded-4xl bg-navy-900 p-5">
        <h2 id="streak-h" className="text-xs font-bold uppercase tracking-wider text-ivory-50/75">
          {t("home.streakTitle")}
        </h2>
        <p className="mb-4 mt-1 flex items-baseline gap-2">
          <span className="tabular text-4xl font-extrabold leading-none">{streak.worked}</span>
          <span className="font-bold text-ivory-50/75">{t("home.streakUnit")}</span>
        </p>
        <div className="overflow-x-auto">
          <DotCalendar
            caption={t("home.streakCount", { days: streak.worked })}
            columns={weekdays(lang)}
            rows={streak.weeks.map((w) => ({
              key: w.weekStart,
              label: formatDay(w.weekStart, lang),
              dots: w.days.map((d) => ({
                key: d.date,
                state: d.state,
                label: t(d.state === "worked" ? "home.dotWorked" : d.state === "off" ? "home.dotOff" : "home.dotFuture", {
                  date: formatDay(d.date, lang),
                }),
              })),
            }))}
          />
        </div>
        <Legend
          items={[
            { cls: "bg-sand-300", label: t("home.legendWorked") },
            { cls: "scale-50 bg-ivory-50/40", label: t("home.legendOff") },
            { cls: "border-2 border-ivory-50/45", label: t("home.legendFuture") },
          ]}
        />
      </section>

      <Link href="/w/voice" className="flex min-h-16 items-center gap-4 rounded-4xl bg-ivory-50 p-5 font-bold text-navy-950">
        <MessageCircle aria-hidden="true" className="size-8 shrink-0" />
        <span className="flex-1">{t("home.voiceCard")}</span>
        <ChevronRight aria-hidden="true" className="size-6" />
      </Link>

      <section aria-labelledby="notices">
        <h2 id="notices" className="mb-3 flex items-center gap-2 text-base font-extrabold">
          <Megaphone aria-hidden="true" className="size-6 text-sand-300" />
          {t("home.notices")}
        </h2>
        {notices.length === 0 ? (
          <p className="text-ivory-50/75">{t("home.noNotices")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {notices.slice(0, 3).map((raw) => {
              const n = { id: raw.id, ...localizedNotice(raw, lang) };
              return (
              <li key={n.id} className="flex items-start justify-between gap-3 rounded-4xl bg-navy-900 p-5">
                <p lang={n.lang}>{n.text}</p>
                <SpeakButton text={n.text} lang={n.lang} listenLabel={t("common.listen")} stopLabel={t("common.stop")} compact />
              </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

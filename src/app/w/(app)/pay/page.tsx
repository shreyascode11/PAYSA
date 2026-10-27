import { ChevronLeft, ChevronRight, CircleAlert, MinusCircle, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SpeakButton } from "@/components/SpeakButton";
import { Ring } from "@/components/ui/Ring";
import { requireWorkerPage } from "@/lib/auth";
import { formatDay, formatHours, formatINR } from "@/lib/i18n";
import { getT } from "@/lib/locale";
import { getRepo } from "@/lib/repo";
import { loadWorker, workerPayslip } from "@/lib/services/worker";
import { addDays } from "@/lib/time";

export const metadata: Metadata = { title: "My pay" };

const REGULAR_WEEK_HOURS = 48;

export default async function Pay({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const session = await requireWorkerPage();
  const { week } = await searchParams;
  const repo = getRepo();
  const ctx = await loadWorker(repo, session.sub);
  if (!ctx) notFound();
  const { lang, t } = await getT();
  const view = await workerPayslip(repo, ctx, lang, week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : undefined);
  const p = view.payslip;
  const period = t("pay.period", { start: formatDay(p.periodStart, lang), end: formatDay(p.periodEnd, lang) });
  const speech = view.sentences.join(" ");
  const navBtn = "flex size-12 items-center justify-center rounded-full bg-cream-50/10 text-cream-50 ring-1 ring-cream-50/15";
  const totalDeductions = p.deductions.reduce((a, d) => a + d.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{t("pay.title")}</h1>

      <nav aria-label={t("pay.title")} className="glass-dark flex items-center justify-between gap-2 rounded-full p-1.5">
        <Link href={`/w/pay?week=${addDays(view.weekStart, -7)}`} aria-label={t("pay.prev")} className={navBtn}>
          <ChevronLeft aria-hidden="true" className="size-6" />
        </Link>
        <p className="tabular text-center font-bold">{period}</p>
        {view.hasNext ? (
          <Link href={`/w/pay?week=${addDays(view.weekStart, 7)}`} aria-label={t("pay.next")} className={navBtn}>
            <ChevronRight aria-hidden="true" className="size-6" />
          </Link>
        ) : (
          <span className="size-12" />
        )}
      </nav>

      {/* Hero: cream card, ink text */}
      <section aria-labelledby="net-h" className="rounded-4xl bg-cream-50 p-6 text-ink-900 shadow-xl shadow-ink-900/30">
        <div className="flex items-start justify-between gap-3">
          <h2 id="net-h" className="text-sm font-bold uppercase tracking-wider text-ink-900/70">
            {t("pay.net")}
          </h2>
          <SpeakButton text={speech} lang={lang} listenLabel={t("common.listen")} stopLabel={t("common.stop")} />
        </div>
        <p className="tabular mt-2 text-6xl font-black leading-none">{formatINR(p.netPay)}</p>
        <p className="mt-3 text-base font-semibold text-ink-900/70">
          {formatINR(p.grossPay)} − {formatINR(totalDeductions)}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        {/* Regular: ink card with an orange ring */}
        <section className="flex flex-col gap-3 rounded-4xl bg-ink-900 p-5 ring-1 ring-cream-50/10">
          <Ring value={p.regularHours} max={REGULAR_WEEK_HOURS} size={84} stroke={8} label={t("pay.regularDetail", { hours: formatHours(p.regularHours), rate: formatINR(p.hourlyRate) })}>
            <span className="tabular text-xl font-black">{formatHours(p.regularHours)}</span>
            <span className="text-[11px] font-bold text-cream-50/75">h</span>
          </Ring>
          <h2 className="text-sm font-bold uppercase tracking-wider text-cream-50/75">{t("pay.regular")}</h2>
          <p className="tabular text-2xl font-black">{formatINR(p.regularPay)}</p>
          <p className="text-sm text-cream-50/75">{t("pay.regularDetail", { hours: formatHours(p.regularHours), rate: formatINR(p.hourlyRate) })}</p>
        </section>
        {/* Overtime: orange card, ink text and an ink ring */}
        <section className="flex flex-col gap-3 rounded-4xl bg-safety-500 p-5 text-ink-900">
          <Ring value={p.otHours} max={Math.max(12, p.otHours)} size={84} stroke={8} tone="light" arc="ink" label={p.otHours > 0 ? t("pay.otDetail", { hours: formatHours(p.otHours), multiplier: p.otMultiplier }) : t("pay.noOt")}>
            <span className="tabular text-xl font-black">{formatHours(p.otHours)}</span>
            <span className="text-[11px] font-bold">h</span>
          </Ring>
          <h2 className="text-sm font-bold uppercase tracking-wider">{t("pay.ot")}</h2>
          <p className="tabular text-2xl font-black">{formatINR(p.otPay)}</p>
          <p className="text-sm font-semibold">{p.otHours > 0 ? t("pay.otDetail", { hours: formatHours(p.otHours), multiplier: p.otMultiplier }) : t("pay.noOt")}</p>
        </section>
      </div>

      {p.deductions.length > 0 && (
        <section aria-labelledby="ded-h" className="glass-dark rounded-4xl p-5">
          <h2 id="ded-h" className="mb-3 text-sm font-bold uppercase tracking-wider text-cream-50/75">
            {t("pay.deductionsTitle")}
          </h2>
          <ul className="flex flex-col gap-2">
            {p.deductions.map((d) => (
              <li key={d.label} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <MinusCircle aria-hidden="true" className="size-5 text-cream-50/75" />
                  {t(`pay.deduction.${d.label}`)}
                </span>
                <span className="tabular text-xl font-extrabold">− {formatINR(d.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {p.openShifts > 0 && (
        <p className="flex gap-2 rounded-3xl bg-warn p-4 font-semibold text-ink-900">
          <CircleAlert aria-hidden="true" className="size-6 shrink-0" />
          {t("pay.openShift", { count: p.openShifts })}
        </p>
      )}

      <section aria-labelledby="explain" className="rounded-4xl bg-mint-100/8 p-5">
        <h2 id="explain" className="mb-2 flex items-center gap-2 text-lg font-extrabold">
          <Sparkles aria-hidden="true" className="size-5 text-mint-100" />
          {t("pay.explain")}
        </h2>
        <ul className="flex flex-col gap-2">
          {view.sentences.map((s) => (
            <li key={s} className="text-cream-50/90">
              {s}
            </li>
          ))}
        </ul>
      </section>

      <Link
        href={`/w/report?type=grievance&category=pay&from=${p.periodStart}&to=${p.periodEnd}`}
        className="flex min-h-16 items-center justify-center gap-3 rounded-full border-2 border-cream-50/45 text-xl font-bold text-cream-50"
      >
        <CircleAlert aria-hidden="true" className="size-7" />
        {t("pay.wrong")}
      </Link>
    </div>
  );
}

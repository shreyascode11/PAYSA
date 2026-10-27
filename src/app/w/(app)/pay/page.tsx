import { ChevronLeft, ChevronRight, CircleAlert, Clock, HandCoins, MinusCircle, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SpeakButton } from "@/components/SpeakButton";
import { requireWorkerPage } from "@/lib/auth";
import { formatDay, formatHours, formatINR } from "@/lib/i18n";
import { getT } from "@/lib/locale";
import { getRepo } from "@/lib/repo";
import { addDays } from "@/lib/time";
import { loadWorker, workerPayslip } from "@/lib/services/worker";

export const metadata: Metadata = { title: "My pay" };

function LineItem({ icon, title, detail, amount, negative = false }: { icon: React.ReactNode; title: string; detail?: string; amount: string; negative?: boolean }) {
  return (
    <li className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-sm">
      <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand [&>svg]:size-7">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block font-bold">{title}</span>
        {detail && <span className="block text-base text-muted">{detail}</span>}
      </span>
      <span className={`text-2xl font-extrabold ${negative ? "text-danger" : ""}`}>
        {negative ? "− " : ""}
        {amount}
      </span>
    </li>
  );
}

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

  return (
    <>
      <ScreenHeader title={t("pay.title")} speak={view.sentences.join(" ")} lang={lang} listenLabel={t("common.listen")} stopLabel={t("common.stop")} />

      <nav aria-label={t("pay.title")} className="mb-4 flex items-center justify-between gap-2">
        <Link href={`/w/pay?week=${addDays(view.weekStart, -7)}`} className="flex min-h-12 items-center gap-1 rounded-xl px-2 font-semibold text-brand">
          <ChevronLeft aria-hidden="true" className="size-6" />
          {t("pay.prev")}
        </Link>
        <p className="text-center font-bold">{period}</p>
        {view.hasNext ? (
          <Link href={`/w/pay?week=${addDays(view.weekStart, 7)}`} className="flex min-h-12 items-center gap-1 rounded-xl px-2 font-semibold text-brand">
            {t("pay.next")}
            <ChevronRight aria-hidden="true" className="size-6" />
          </Link>
        ) : (
          <span className="min-w-12" />
        )}
      </nav>

      <ul className="flex flex-col gap-3">
        <LineItem
          icon={<Wallet />}
          title={t("pay.regular")}
          detail={t("pay.regularDetail", { hours: formatHours(p.regularHours), rate: formatINR(p.hourlyRate) })}
          amount={formatINR(p.regularPay)}
        />
        <LineItem
          icon={<Clock />}
          title={t("pay.ot")}
          detail={p.otHours > 0 ? t("pay.otDetail", { hours: formatHours(p.otHours), multiplier: p.otMultiplier }) : t("pay.noOt")}
          amount={formatINR(p.otPay)}
        />
        {p.deductions.map((d) => (
          <LineItem key={d.label} icon={<MinusCircle />} title={t(`pay.deduction.${d.label}`)} detail={t("pay.deductionsTitle")} amount={formatINR(d.amount)} negative />
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-brand p-5 text-brand-ink">
        <span className="flex items-center gap-3 text-xl font-bold">
          <HandCoins aria-hidden="true" className="size-8" />
          {t("pay.net")}
        </span>
        <span className="text-4xl font-extrabold">{formatINR(p.netPay)}</span>
      </div>

      {p.openShifts > 0 && (
        <p className="mt-3 flex gap-2 rounded-xl bg-warn-soft p-3 font-semibold text-warn">
          <CircleAlert aria-hidden="true" className="size-6 shrink-0" />
          {t("pay.openShift", { count: p.openShifts })}
        </p>
      )}

      <section aria-labelledby="explain" className="mt-6 rounded-2xl bg-surface p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 id="explain" className="text-xl font-bold">
            {t("pay.explain")}
          </h2>
          <SpeakButton text={view.sentences.join(" ")} lang={lang} listenLabel={t("common.listen")} stopLabel={t("common.stop")} />
        </div>
        <ul className="list-disc space-y-1 pl-5">
          {view.sentences.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <Link
        href={`/w/report?type=grievance&category=pay&from=${p.periodStart}&to=${p.periodEnd}`}
        className="mt-6 flex min-h-16 items-center justify-center gap-3 rounded-2xl border-2 border-danger text-xl font-bold text-danger"
      >
        <CircleAlert aria-hidden="true" className="size-7" />
        {t("pay.wrong")}
      </Link>
    </>
  );
}

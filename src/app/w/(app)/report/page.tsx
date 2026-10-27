import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReportFlow } from "@/components/ReportFlow";
import { aiEnabled } from "@/lib/ai/gemini";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TrackForm } from "@/components/TrackForm";
import { requireWorkerPage } from "@/lib/auth";
import { formatDay } from "@/lib/i18n";
import { getT } from "@/lib/locale";
import { reportLabels, reportTypeOption } from "@/components/report-labels";
import { getRepo } from "@/lib/repo";

export const metadata: Metadata = { title: "Report a problem" };

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export default async function Report({ searchParams }: { searchParams: Promise<{ type?: string; category?: string; from?: string; to?: string }> }) {
  const session = await requireWorkerPage();
  const org = await getRepo().getOrg(session.orgId);
  if (!org) notFound();
  const sp = await searchParams;
  const { lang, t } = await getT();
  const types = [
    reportTypeOption("hazard", t("report.typeHazard"), org.sector, t),
    reportTypeOption("grievance", t("report.typeGrievance"), org.sector, t),
  ];
  const initialType = sp.type === "grievance" ? "grievance" : "hazard";
  const initialCategory = types.find((x) => x.type === initialType)?.categories.some((c) => c.id === sp.category) ? sp.category : undefined;
  // "Something wrong?" on the payslip pre-fills which pay period the complaint is about.
  const prefill =
    sp.from && sp.to && DAY.test(sp.from) && DAY.test(sp.to)
      ? `${t("report.periodNote", { start: formatDay(sp.from, lang), end: formatDay(sp.to, lang) })}: `
      : "";

  return (
    <>
      <ScreenHeader title={t("report.title")} speak={t("report.speak")} lang={lang} listenLabel={t("common.listen")} stopLabel={t("common.stop")} />
      <ReportFlow aiVoice={aiEnabled()} lang={lang} types={types} initialType={initialType} initialCategory={initialCategory} prefillText={prefill} labels={reportLabels(t)} />
      <section className="mt-10 rounded-2xl bg-navy-900 p-4">
        <TrackForm label={t("track.enter")} button={t("track.check")} />
      </section>
    </>
  );
}

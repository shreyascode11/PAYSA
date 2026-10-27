import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { PulseForm } from "@/components/PulseForm";
import { ReportFlow } from "@/components/ReportFlow";
import { aiEnabled } from "@/lib/ai/gemini";
import { ScreenHeader } from "@/components/ScreenHeader";
import { requireWorkerPage } from "@/lib/auth";
import { PULSE_COOKIE } from "@/lib/constants";
import { getT } from "@/lib/locale";
import { reportLabels, reportTypeOption } from "@/lib/report-labels";
import { getRepo } from "@/lib/repo";
import { localDateKey, weekStartKey } from "@/lib/time";

export const metadata: Metadata = { title: "My voice" };

export default async function Voice() {
  const session = await requireWorkerPage();
  const org = await getRepo().getOrg(session.orgId);
  if (!org) notFound();
  const { lang, t } = await getT();
  const answered = (await cookies()).get(PULSE_COOKIE)?.value === weekStartKey(localDateKey(new Date()));
  const labels = { ...reportLabels(t), submit: t("voice.commentSubmit"), step1: t("voice.commentAbout") };

  return (
    <>
      <ScreenHeader title={t("voice.title")} speak={t("voice.speak")} lang={lang} listenLabel={t("common.listen")} stopLabel={t("common.stop")} />
      <PulseForm
        question={t("voice.pulseQ")}
        faceLabels={Object.fromEntries([1, 2, 3, 4, 5].map((n) => [n, t(`voice.face.${n}`)]))}
        thanks={t("voice.pulseThanks")}
        already={t("voice.pulseDone")}
        errorText={t("common.error")}
        answered={answered}
      />
      <section aria-labelledby="comment" className="mt-10">
        <h2 id="comment" className="mb-4 text-xl font-bold">
          {t("voice.commentTitle")}
        </h2>
        <ReportFlow
          aiVoice={aiEnabled()}
          lang={lang}
          types={[reportTypeOption("manager_feedback", t("voice.commentAbout"), org.sector, t)]}
          initialType="manager_feedback"
          forceAnonymous
          labels={labels}
        />
      </section>
    </>
  );
}

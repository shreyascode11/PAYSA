import type { Metadata } from "next";
import { CheckInFlow } from "@/components/CheckInFlow";
import { ScreenHeader } from "@/components/ScreenHeader";
import { WorkerLoginPanel } from "@/components/WorkerLoginPanel";
import { getWorkerSession } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { getRepo } from "@/lib/repo";

export const metadata: Metadata = { title: "Check in" };

const ERROR_CODES = ["expired_qr", "bad_qr", "wrong_site", "photo_failed", "outside", "already_in", "not_in", "gps_denied", "gps_unavailable", "camera_denied", "no_site"];

export default async function CheckIn({ searchParams }: { searchParams: Promise<{ site?: string; t?: string }> }) {
  const { site, t: token } = await searchParams;
  const session = await getWorkerSession();
  const { lang, t } = await getT();
  // Outside the (app) group: a poster QR scanned while logged out logs in right here and keeps its token.
  if (!session) {
    const back = site && token ? `/w/checkin?site=${encodeURIComponent(site)}&t=${encodeURIComponent(token)}` : "/w/checkin";
    return (
      <main id="main" className="flex-1 px-4 pb-10">
        <WorkerLoginPanel lang={lang} t={t} next={back} />
      </main>
    );
  }
  const open = await getRepo().getOpenShift(session.sub);
  const mode = open ? "out" : "in";
  const title = t(mode === "in" ? "checkin.titleIn" : "checkin.titleOut");

  return (
    <main id="main" className="flex-1 px-4 pb-10 pt-4">
      <ScreenHeader
        title={title}
        speak={mode === "in" ? t("checkin.speak") : t("checkin.confirmOut")}
        lang={lang}
        listenLabel={t("common.listen")}
        stopLabel={t("common.stop")}
      />
      <CheckInFlow
        mode={mode}
        lang={lang}
        initialQr={site && token ? { siteId: site, token } : undefined}
        labels={{
          choose: t("checkin.choose"),
          scanQr: t("checkin.scanQr"),
          useGps: t("checkin.useGps"),
          scanning: t("checkin.scanning"),
          photo: t("checkin.photo"),
          locating: t("checkin.locating"),
          endWork: t("home.endWork"),
          confirmOut: t("checkin.confirmOut"),
          successIn: t("checkin.successIn"),
          successOut: t("checkin.successOut"),
          goHome: t("checkin.goHome"),
          stepReady: t("checkin.stepReady"),
          stepScan: t("checkin.stepScan"),
          stepDone: t("checkin.stepDone"),
          stepOf: t("checkin.stepOf"),
          permission: t("checkin.permission"),
          tryAgain: t("checkin.tryAgain"),
          cancel: t("common.cancel"),
          generic: t("common.error"),
          offline: t("common.offline"),
          errors: Object.fromEntries(ERROR_CODES.map((c) => [c, t(`checkin.err.${c}`)])),
        }}
      />
    </main>
  );
}

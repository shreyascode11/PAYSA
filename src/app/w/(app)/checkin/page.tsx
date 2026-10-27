import type { Metadata } from "next";
import { CheckInFlow } from "@/components/CheckInFlow";
import { ScreenHeader } from "@/components/ScreenHeader";
import { requireWorkerPage } from "@/lib/auth";
import { LANG_TAGS } from "@/lib/i18n";
import { getT } from "@/lib/locale";
import { getRepo } from "@/lib/repo";

export const metadata: Metadata = { title: "Check in" };

const ERROR_CODES = ["expired_qr", "bad_qr", "outside", "already_in", "not_in", "gps_denied", "gps_unavailable", "camera_denied", "no_site"];

export default async function CheckIn({ searchParams }: { searchParams: Promise<{ site?: string; t?: string }> }) {
  const session = await requireWorkerPage();
  const { site, t: token } = await searchParams;
  const { lang, t } = await getT();
  const open = await getRepo().getOpenShift(session.sub);
  const mode = open ? "out" : "in";
  const title = t(mode === "in" ? "checkin.titleIn" : "checkin.titleOut");

  return (
    <>
      <ScreenHeader
        title={title}
        speak={mode === "in" ? t("checkin.speak") : t("checkin.confirmOut")}
        lang={lang}
        listenLabel={t("common.listen")}
        stopLabel={t("common.stop")}
      />
      <CheckInFlow
        mode={mode}
        locale={LANG_TAGS[lang]}
        initialQr={site && token ? { siteId: site, token } : undefined}
        labels={{
          choose: t("checkin.choose"),
          scanQr: t("checkin.scanQr"),
          useGps: t("checkin.useGps"),
          scanning: t("checkin.scanning"),
          locating: t("checkin.locating"),
          endWork: t("home.endWork"),
          confirmOut: t("checkin.confirmOut"),
          successIn: t("checkin.successIn"),
          successOut: t("checkin.successOut"),
          goHome: t("checkin.goHome"),
          generic: t("common.error"),
          offline: t("common.offline"),
          errors: Object.fromEntries(ERROR_CODES.map((c) => [c, t(`checkin.err.${c}`)])),
        }}
      />
    </>
  );
}

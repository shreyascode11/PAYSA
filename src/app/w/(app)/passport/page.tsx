import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { CopyLink } from "@/components/CopyLink";
import { PassportCard } from "@/components/PassportCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { requireWorkerPage } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { getRepo } from "@/lib/repo";
import { buildPassport } from "@/lib/services/passport";

export const metadata: Metadata = { title: "Skill Passport" };

export default async function Passport() {
  const session = await requireWorkerPage();
  const passport = await buildPassport(getRepo(), session.sub);
  if (!passport) notFound();
  const { lang, t } = await getT();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const url = `${proto}://${host}/p/${passport.passportId}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1 });

  return (
    <>
      <ScreenHeader
        title={t("passport.title")}
        speak={t("passport.speak", { days: passport.verifiedDays, skills: passport.skills.length })}
        lang={lang}
        listenLabel={t("common.listen")}
        stopLabel={t("common.stop")}
      />
      <PassportCard passport={passport} t={t} />
      <section aria-labelledby="share" className="glass-dark mt-8 rounded-4xl p-5">
        <h2 id="share" className="mb-2 text-xl font-bold">
          {t("passport.share")}
        </h2>
        <p className="mb-4 text-ivory-50/75">{t("passport.shareHint")}</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- generated SVG data URL */}
        <img src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`} alt={t("passport.share")} className="mx-auto mb-4 size-52 rounded-3xl bg-ivory-50 p-3" />
        <CopyLink url={url} copyLabel={t("common.copy")} copiedLabel={t("common.copied")} shareLabel={t("passport.share")} />
      </section>
    </>
  );
}

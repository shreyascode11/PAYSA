import { ArrowRight, Building2, GraduationCap } from "lucide-react";
import Link from "next/link";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo, Mascot } from "@/components/Logo";
import { TrackForm } from "@/components/TrackForm";
import { IdBadge } from "@/components/ui/IdBadge";
import { getT } from "@/lib/locale";

function EnterLink({ href, label, name }: { href: string; label: string; name: string }) {
  return (
    <Link
      href={href}
      aria-label={`${label}: ${name}`}
      className="group mt-5 flex min-h-14 items-center justify-between rounded-full bg-safety-500 pl-5 pr-1.5 text-lg font-extrabold text-ink-900"
    >
      {label}
      <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-ink-900 text-cream-50 transition group-hover:translate-x-0.5">
        <ArrowRight className="size-5" />
      </span>
    </Link>
  );
}

/** Role picker: two hanging ID badges, worker and supervisor. */
export default async function Landing() {
  const { lang, t } = await getT();
  return (
    <div className="bg-aurora min-h-dvh text-cream-50">
      <div className="mx-auto flex max-w-4xl flex-col px-4 py-5">
        <header className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-xl font-extrabold tracking-[0.18em]">
            <Logo className="size-10" />
            PAYSA
          </p>
          <LangSwitch current={lang} label={t("common.language")} />
        </header>
        <main id="main" className="flex flex-col gap-10 pt-8">
          <section className="max-w-xl">
            <h1 className="text-4xl font-black leading-tight sm:text-5xl">{t("landing.title")}</h1>
            <p className="mt-3 text-lg text-cream-50/80">{t("landing.intro")}</p>
          </section>

          <section aria-label={t("common.appName")} className="grid items-start gap-6 sm:grid-cols-2 sm:gap-10">
            <IdBadge kind={t("landing.workerKind")} footer={<span>{t("landing.workerHint")}</span>}>
              <div className="flex aspect-[4/3] items-end justify-center overflow-hidden rounded-3xl bg-cream-50/90">
                <Mascot className="h-[88%] w-auto translate-y-2" />
              </div>
              <h2 className="mt-5 text-3xl font-black leading-none">{t("landing.workerBig")}</h2>
              <p className="mt-1 text-cream-50/75">{t("landing.worker")}</p>
              <EnterLink href="/w/login" label={t("landing.enter")} name={t("landing.worker")} />
            </IdBadge>
            <IdBadge kind={t("landing.adminKind")} footer={<span>{t("landing.adminHint")}</span>} className="sm:mt-16">
              <div className="flex aspect-[4/3] flex-col justify-center rounded-3xl">
                <h2 className="break-words text-4xl font-black leading-none tracking-tight sm:text-5xl">{t("landing.adminBig")}</h2>
                <p className="mt-3 flex items-center gap-2 text-cream-50/75">
                  <Building2 aria-hidden="true" className="size-5" />
                  <GraduationCap aria-hidden="true" className="size-5" />
                  {t("landing.site")}
                </p>
              </div>
              <p className="mt-5 text-cream-50/75">{t("landing.admin")}</p>
              <EnterLink href="/admin/login" label={t("landing.enter")} name={t("landing.admin")} />
            </IdBadge>
          </section>

          <section className="glass-dark rounded-3xl p-5 sm:max-w-xl">
            <TrackForm label={t("track.enter")} button={t("track.check")} />
          </section>
          <p className="pb-6 text-base text-cream-50/75">{t("landing.sectors")}</p>
        </main>
      </div>
    </div>
  );
}

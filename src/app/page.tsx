import { HardHat, LayoutDashboard } from "lucide-react";
import { BigButton } from "@/components/BigButton";
import { LangSwitch } from "@/components/LangSwitch";
import { TrackForm } from "@/components/TrackForm";
import { getT } from "@/lib/locale";

export default async function Landing() {
  const { lang, t } = await getT();
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 py-6 text-lg">
      <header className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-2xl font-extrabold text-brand">
          <svg aria-hidden="true" viewBox="0 0 64 64" className="size-9">
            <rect width="64" height="64" rx="14" fill="currentColor" />
            <path d="M18 46V18h26v7H26v5h15v7H26v9z" fill="var(--bg)" />
          </svg>
          {t("common.appName")}
        </p>
        <LangSwitch current={lang} label={t("common.language")} />
      </header>
      <main id="main" className="flex flex-1 flex-col gap-8 pt-10">
        <section>
          <h1 className="text-3xl font-extrabold leading-tight">{t("landing.title")}</h1>
          <p className="mt-3 text-muted">{t("landing.intro")}</p>
        </section>
        <section className="flex flex-col gap-4" aria-label={t("common.appName")}>
          <BigButton href="/w/login" icon={<HardHat />} label={t("landing.worker")} sublabel={t("landing.workerHint")} />
          <BigButton href="/admin/login" tone="neutral" icon={<LayoutDashboard />} label={t("landing.admin")} sublabel={t("landing.adminHint")} />
        </section>
        <section className="rounded-2xl bg-surface p-4">
          <TrackForm label={t("track.enter")} button={t("track.check")} />
        </section>
        <p className="text-base text-muted">{t("landing.sectors")}</p>
      </main>
    </div>
  );
}

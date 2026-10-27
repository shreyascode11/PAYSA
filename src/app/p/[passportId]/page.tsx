import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo } from "@/components/Logo";
import { PassportCard } from "@/components/PassportCard";
import { getT } from "@/lib/locale";
import { getRepo } from "@/lib/repo";
import { buildPassport } from "@/lib/services/passport";

export const metadata: Metadata = { title: "Skill Passport", robots: { index: false } };

/** Public, read-only. Reachable only via the unguessable passport id the worker chooses to share. */
export default async function PublicPassport({ params }: { params: Promise<{ passportId: string }> }) {
  const { passportId } = await params;
  const repo = getRepo();
  const worker = /^[\w-]{1,64}$/.test(passportId) ? await repo.findWorkerByPassport(passportId) : undefined;
  const passport = worker && (await buildPassport(repo, worker.id));
  if (!passport) notFound();
  const { lang, t } = await getT();

  return (
    <div className="bg-aurora min-h-dvh text-base text-ivory-50">
    <div className="mx-auto max-w-md px-4 py-6">
      <header className="mb-6 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-lg font-extrabold tracking-[0.18em]">
          <Logo className="size-9" />
          {t("common.appName")}
        </p>
        <LangSwitch current={lang} label={t("common.language")} />
      </header>
      <main id="main">
        <h1 className="sr-only">{t("passport.publicTitle")}</h1>
        <PassportCard passport={passport} t={t} />
        <p className="mt-6 flex items-center gap-2 text-base text-ivory-50/75">
          <ShieldCheck aria-hidden="true" className="size-5 text-sand-300" />
          {t("passport.publicPrivacy")}
        </p>
      </main>
    </div>
    </div>
  );
}

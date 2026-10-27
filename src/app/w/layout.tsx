import Link from "next/link";
import { LangSwitch } from "@/components/LangSwitch";
import { getT } from "@/lib/locale";

export default async function WorkerShell({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getT();
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col text-lg">
      <header className="no-print sticky top-0 z-20 flex items-center justify-between gap-2 border-b-2 border-line bg-bg/95 px-4 py-2 backdrop-blur">
        <Link href="/w/home" className="flex min-h-11 items-center gap-2 text-xl font-extrabold text-brand">
          <svg aria-hidden="true" viewBox="0 0 64 64" className="size-8">
            <rect width="64" height="64" rx="14" fill="currentColor" />
            <path d="M18 46V18h26v7H26v5h15v7H26v9z" fill="var(--bg)" />
          </svg>
          {t("common.appName")}
        </Link>
        <LangSwitch current={lang} label={t("common.language")} />
      </header>
      {children}
    </div>
  );
}

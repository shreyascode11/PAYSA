import Link from "next/link";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo } from "@/components/Logo";
import { getT } from "@/lib/locale";

export default async function WorkerShell({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getT();
  return (
    <div className="theme-worker bg-aurora min-h-dvh text-lg text-cream-50">
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="no-print glass-dark sticky top-0 z-20 flex items-center justify-between gap-2 rounded-b-3xl px-4 py-3 shadow-none">
        <Link href="/w/home" className="flex min-h-11 items-center gap-2 text-xl font-extrabold tracking-wide">
          <Logo />
          <span className="tracking-[0.18em]">{t("common.appName")}</span>
        </Link>
        <LangSwitch current={lang} label={t("common.language")} />
      </header>
      {children}
      </div>
    </div>
  );
}

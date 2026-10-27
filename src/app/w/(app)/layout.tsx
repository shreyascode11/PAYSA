import { LogOut } from "lucide-react";
import { PillNav } from "@/components/ui/PillNav";
import { requireWorkerPage } from "@/lib/auth";
import { getT } from "@/lib/locale";

export default async function WorkerAppLayout({ children }: { children: React.ReactNode }) {
  await requireWorkerPage();
  const { t } = await getT();
  return (
    <>
      <main id="main" className="flex-1 px-4 pb-32 pt-4">
        {children}
        <form action="/api/auth/logout" method="post" className="no-print mt-10">
          <button type="submit" className="flex min-h-12 items-center gap-2 rounded-full px-3 font-semibold text-cream-50/75 underline">
            <LogOut aria-hidden="true" className="size-5" />
            {t("common.logout")}
          </button>
        </form>
      </main>
      <PillNav
        label={t("nav.label")}
        items={[
          { href: "/w/home", label: t("nav.home"), icon: "home" },
          { href: "/w/pay", label: t("nav.pay"), icon: "pay" },
          { href: "/w/report", label: t("nav.report"), icon: "report" },
          { href: "/w/passport", label: t("nav.passport"), icon: "passport" },
        ]}
      />
    </>
  );
}

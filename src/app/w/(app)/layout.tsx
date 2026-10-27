import { LogOut } from "lucide-react";
import { WorkerNav } from "@/components/WorkerNav";
import { requireWorkerPage } from "@/lib/auth";
import { getT } from "@/lib/locale";

export default async function WorkerAppLayout({ children }: { children: React.ReactNode }) {
  await requireWorkerPage();
  const { t } = await getT();
  return (
    <>
      <main id="main" className="flex-1 px-4 pb-28 pt-5">
        {children}
        <form action="/api/auth/logout" method="post" className="no-print mt-10">
          <button type="submit" className="flex min-h-12 items-center gap-2 rounded-xl px-3 font-semibold text-muted underline">
            <LogOut aria-hidden="true" className="size-5" />
            {t("common.logout")}
          </button>
        </form>
      </main>
      <WorkerNav
        navLabel={t("nav.label")}
        labels={{
          home: t("nav.home"),
          pay: t("nav.pay"),
          report: t("nav.report"),
          voice: t("nav.voice"),
          passport: t("nav.passport"),
        }}
      />
    </>
  );
}

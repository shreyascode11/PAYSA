import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { ScreenHeader } from "@/components/ScreenHeader";
import { DEMO } from "@/data/seed";
import { getWorkerSession } from "@/lib/auth";
import { getT } from "@/lib/locale";

export const metadata: Metadata = { title: "Worker login" };

export default async function WorkerLogin() {
  if (await getWorkerSession()) redirect("/w/home");
  const { lang, t } = await getT();
  return (
    <main id="main" className="flex-1 px-4 py-6">
      <ScreenHeader title={t("login.title")} speak={t("login.speak")} lang={lang} listenLabel={t("common.listen")} stopLabel={t("common.stop")} />
      <LoginForm
        endpoint="/api/auth/worker-login"
        submitLabel={t("login.submit")}
        messages={{ invalid: t("login.invalid"), tooMany: t("common.tooMany"), generic: t("common.error"), offline: t("common.offline") }}
        fields={[
          { name: "phone", label: t("login.phone"), type: "tel", inputMode: "numeric", autoComplete: "tel-national", pattern: "\\d{10}", maxLength: 10 },
          { name: "pin", label: t("login.pin"), type: "password", inputMode: "numeric", autoComplete: "current-password", pattern: "\\d{4}", maxLength: 4 },
        ]}
      />
      <aside className="mt-8 rounded-xl bg-surface-2 p-4 text-base text-muted">
        <p>{t("login.demo", { phone: DEMO.constructionWorkerPhone, pin: DEMO.pin })}</p>
        <p>{t("login.demo", { phone: DEMO.collegeWorkerPhone, pin: DEMO.pin })}</p>
        <p>{t("login.demo", { phone: DEMO.hindiWorkerPhone, pin: DEMO.pin })}</p>
      </aside>
    </main>
  );
}

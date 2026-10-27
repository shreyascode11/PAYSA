import { DEMO } from "@/data/seed";
import type { Translator } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { LoginForm } from "./LoginForm";
import { ScreenHeader } from "./ScreenHeader";

/** Phone + PIN login, used by /w/login and inline wherever a deep link must survive logging in. */
export function WorkerLoginPanel({ lang, t, next }: { lang: Lang; t: Translator; next?: string }) {
  return (
    <>
      <ScreenHeader title={t("login.title")} speak={t("login.speak")} lang={lang} listenLabel={t("common.listen")} stopLabel={t("common.stop")} />
      <LoginForm
        endpoint="/api/auth/worker-login"
        next={next}
        submitLabel={t("login.submit")}
        messages={{ invalid: t("login.invalid"), tooMany: t("common.tooMany"), generic: t("common.error"), offline: t("common.offline") }}
        fields={[
          { name: "phone", label: t("login.phone"), type: "tel", inputMode: "numeric", autoComplete: "tel-national", pattern: "\\d{10}", maxLength: 10 },
          { name: "pin", label: t("login.pin"), type: "password", inputMode: "numeric", autoComplete: "current-password", pattern: "\\d{4}", maxLength: 4 },
        ]}
      />
      <aside className="mt-8 rounded-xl bg-surface-2 p-4 text-base text-muted">
        {[DEMO.constructionWorkerPhone, DEMO.collegeWorkerPhone, DEMO.hindiWorkerPhone].map((phone) => (
          <p key={phone}>{t("login.demo", { phone, pin: DEMO.pin })}</p>
        ))}
      </aside>
    </>
  );
}

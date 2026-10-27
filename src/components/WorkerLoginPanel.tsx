import { KeyRound, ShieldCheck } from "lucide-react";
import { DEMO } from "@/data/seed";
import type { Translator } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { LoginForm } from "./LoginForm";
import { SpeakButton } from "./SpeakButton";
import { IdBadge } from "./ui/IdBadge";

/** Worker sign-in as a lanyard ID badge. Used by /w/login and inline on /w/checkin deep links. */
export function WorkerLoginPanel({ lang, t, next }: { lang: Lang; t: Translator; next?: string }) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <IdBadge
        kind={t("login.kind")}
        footer={
          <>
            <span className="flex items-center gap-1.5">
              <ShieldCheck aria-hidden="true" className="size-4" />
              {t("login.secure")}
            </span>
            <span className="tabular">ID ••••</span>
          </>
        }
      >
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black leading-none tracking-tight sm:text-5xl">{t("login.big")}</h1>
            <p className="mt-2 text-base text-cream-50/75">{t("common.tagline")}</p>
          </div>
          <SpeakButton text={t("login.speak")} lang={lang} listenLabel={t("common.listen")} stopLabel={t("common.stop")} compact />
        </div>
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
      </IdBadge>
      <aside aria-labelledby="demo-h" className="glass-dark rounded-3xl p-5 text-base">
        <h2 id="demo-h" className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-cream-50/75">
          <KeyRound aria-hidden="true" className="size-4" />
          {t("login.demoTitle")}
        </h2>
        {[DEMO.constructionWorkerPhone, DEMO.collegeWorkerPhone, DEMO.hindiWorkerPhone].map((phone) => (
          <p key={phone} className="tabular">
            {t("login.demo", { phone, pin: DEMO.pin })}
          </p>
        ))}
      </aside>
    </div>
  );
}

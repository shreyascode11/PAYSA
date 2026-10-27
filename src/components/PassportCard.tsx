import { Award, BadgeCheck, CalendarCheck } from "lucide-react";
import type { Translator } from "@/lib/i18n";
import type { PublicPassport } from "@/lib/services/passport";
import { IdBadge } from "./ui/IdBadge";
import { StatusPill } from "./ui/StatusPill";

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

/** The Skill Passport as a portable ID badge. Shared by the worker's own view and the public link. */
export function PassportCard({ passport, t }: { passport: PublicPassport; t: Translator }) {
  return (
    <IdBadge
      kind={t("passport.publicTitle")}
      footer={
        <>
          <span className="flex items-center gap-1.5">
            <BadgeCheck aria-hidden="true" className="size-4" />
            {passport.orgName}
          </span>
          <span className="tabular uppercase">ID {passport.passportId.slice(-6)}</span>
        </>
      }
    >
      <div className="flex items-center gap-4">
        <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-ivory-50/90 text-2xl font-black text-navy-950">
          {initials(passport.name)}
        </span>
        <div className="min-w-0">
          <p className="text-xl font-black leading-tight">{passport.name}</p>
          <p className="text-ivory-50/75">{passport.role}</p>
        </div>
      </div>

      <p className="mt-5 flex items-center gap-3 rounded-3xl bg-ivory-50/8 p-4">
        <CalendarCheck aria-hidden="true" className="size-8 shrink-0 text-sand-300" />
        <span>
          <span className="tabular block text-3xl font-black leading-none">{passport.verifiedDays}</span>
          <span className="text-sm text-ivory-50/75">{t("passport.daysLabel")}</span>
        </span>
      </p>

      <h2 className="mb-3 mt-6 text-sm font-bold uppercase tracking-[0.14em] text-ivory-50/75">{t("passport.skills")}</h2>
      {passport.skills.length === 0 ? (
        <p className="text-ivory-50/75">{t("passport.noSkills")}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {passport.skills.map((s) => (
            <li key={s.skill} className="rounded-3xl bg-ivory-50/8 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-bold">
                  <Award aria-hidden="true" className="size-5 text-sand-300" />
                  {t(`passport.skill.${s.skill}`)}
                </span>
                <span role="img" aria-label={t("passport.level", { level: s.level })} className="flex gap-1">
                  {[1, 2, 3].map((n) => (
                    <span key={n} aria-hidden="true" className={`size-3 rounded-full ${n <= s.level ? "bg-sand-300" : "border-2 border-ivory-50/45"}`} />
                  ))}
                </span>
              </div>
              <p className="mt-1 text-sm text-ivory-50/75">
                {t("passport.level", { level: s.level })} · {t(`passport.source.${s.source}`)}
              </p>
              {s.endorsedByName && (
                <div className="mt-2">
                  <StatusPill tone="ok" icon={BadgeCheck} label={t("passport.endorsed", { org: s.endorsedByName })} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </IdBadge>
  );
}

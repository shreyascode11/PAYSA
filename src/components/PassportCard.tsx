import { Award, BadgeCheck, CalendarCheck } from "lucide-react";
import type { Translator } from "@/lib/i18n";
import type { PublicPassport } from "@/lib/services/passport";

/** Shared by the worker's own view and the public read-only link. */
export function PassportCard({ passport, t }: { passport: PublicPassport; t: Translator }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-brand p-5 text-brand-ink">
        <p className="text-2xl font-extrabold">{passport.name}</p>
        <p>{passport.role}</p>
        <p className="mt-3 flex items-center gap-2 text-xl font-bold">
          <CalendarCheck aria-hidden="true" className="size-7" />
          {t("passport.days", { days: passport.verifiedDays })}
        </p>
      </div>
      <section aria-labelledby="skills-h">
        <h2 id="skills-h" className="mb-3 text-xl font-bold">
          {t("passport.skills")}
        </h2>
        {passport.skills.length === 0 ? (
          <p className="text-muted">{t("passport.noSkills")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {passport.skills.map((s) => (
              <li key={s.skill} className="flex items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm">
                <Award aria-hidden="true" className="size-8 shrink-0 text-brand" />
                <div className="flex-1">
                  <p className="font-bold">{t(`passport.skill.${s.skill}`)}</p>
                  <p className="text-base text-muted">
                    {t("passport.level", { level: s.level })} · {t(`passport.source.${s.source}`)}
                  </p>
                  {s.endorsedByName && (
                    <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-ok-soft px-2.5 py-0.5 text-sm font-semibold text-ok">
                      <BadgeCheck aria-hidden="true" className="size-4" />
                      {t("passport.endorsed", { org: s.endorsedByName })}
                    </p>
                  )}
                </div>
                <span aria-hidden="true" className="flex gap-0.5 pt-1">
                  {[1, 2, 3].map((n) => (
                    <span key={n} className={`size-3 rounded-full ${n <= s.level ? "bg-brand" : "bg-surface-2"}`} />
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

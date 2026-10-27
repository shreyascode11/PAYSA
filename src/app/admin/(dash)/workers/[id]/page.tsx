import { ArrowLeft, BadgeCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ACTION_LABELS, FatigueBadge, RiskBadge, humanize } from "@/components/admin/badges";
import { PostButton } from "@/components/admin/PostButton";
import { adminPageContext } from "@/lib/admin-context";
import { formatINR } from "@/lib/i18n";
import { getRepo } from "@/lib/repo";
import { sectorConfig } from "@/lib/sectors";
import { attritionTable, loadOrgData } from "@/lib/services/admin";
import { verifiedDaysWorked, workerSummary } from "@/lib/services/worker";

export const metadata: Metadata = { title: "Worker" };

export default async function WorkerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { org } = await adminPageContext();
  const repo = getRepo();
  const worker = await repo.getWorker((await params).id);
  if (!worker || worker.orgId !== org.id) notFound();
  const data = await loadOrgData(repo, org.id);
  if (!data) notFound();
  const [summary, skills, days, attrition] = await Promise.all([
    workerSummary(repo, { worker, org }),
    repo.listSkills(worker.id),
    verifiedDaysWorked(repo, worker.id),
    attritionTable(repo, data),
  ]);
  const risk = attrition.find((r) => r.worker.id === worker.id)?.result;
  const has = new Map(skills.map((s) => [s.skill, s]));

  return (
    <>
      <Link href="/admin/workers" className="mb-4 inline-flex min-h-11 items-center gap-1 font-semibold text-brand">
        <ArrowLeft aria-hidden="true" className="size-5" /> All workers
      </Link>
      <h1 className="text-3xl font-extrabold">{worker.name}</h1>
      <p className="mb-6 text-muted">
        {worker.role} · {org.teams.find((t) => t.id === worker.teamId)?.name} · {formatINR(worker.dailyWage)}/day · {days} verified days
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="week" className="rounded-2xl bg-surface p-4 shadow-sm">
          <h2 id="week" className="mb-3 text-lg font-bold">
            This week
          </h2>
          <dl className="grid grid-cols-3 gap-3">
            <div>
              <dt className="text-sm text-muted">Today</dt>
              <dd className="text-2xl font-bold">{summary.todayHours}h</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Week</dt>
              <dd className="text-2xl font-bold">{summary.weekHours}h</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Overtime</dt>
              <dd className="text-2xl font-bold">{summary.weekOtHours}h</dd>
            </div>
          </dl>
          <p className="mt-4 flex items-center gap-2 font-semibold">
            Fatigue: <FatigueBadge level={summary.fatigue.level} />
          </p>
          {summary.fatigue.reasons.length > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {summary.fatigue.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="risk" className="rounded-2xl bg-surface p-4 shadow-sm">
          <h2 id="risk" className="mb-3 flex items-center gap-2 text-lg font-bold">
            Quit risk {risk && <RiskBadge band={risk.band} score={risk.score} />}
          </h2>
          {risk && risk.drivers.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {risk.drivers.map((d) => (
                <li key={d.code}>
                  {d.detail} <span className="text-muted">(+{d.points} · {ACTION_LABELS[d.action]})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No risk signals.</p>
          )}
        </section>

        <section aria-labelledby="skills" className="rounded-2xl bg-surface p-4 shadow-sm lg:col-span-2">
          <h2 id="skills" className="mb-1 text-lg font-bold">
            Skill Passport
          </h2>
          <p className="mb-3 text-sm text-muted">Endorsing adds an &quot;Endorsed by {org.name}&quot; badge on the worker&apos;s portable passport.</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {sectorConfig(org.sector).skills.map((skill) => {
              const entry = has.get(skill);
              return (
                <li key={skill} className="flex min-h-12 items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2">
                  <span>
                    {humanize(skill)}
                    {entry && <span className="ml-2 text-sm text-muted">level {entry.level} · {entry.source}</span>}
                  </span>
                  {entry?.endorsedBy ? (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-ok">
                      <BadgeCheck aria-hidden="true" className="size-4" /> Endorsed
                    </span>
                  ) : (
                    <PostButton endpoint="/api/admin/skills/endorse" body={{ workerId: worker.id, skill }} doneLabel="Endorsed">
                      Endorse
                    </PostButton>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}

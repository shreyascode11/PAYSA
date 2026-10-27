import type { Metadata } from "next";
import Link from "next/link";
import { ACTION_LABELS, RiskBadge } from "@/components/admin/badges";
import { adminPageContext } from "@/lib/admin-context";
import { getRepo } from "@/lib/repo";
import { attritionTable, loadOrgData } from "@/lib/services/admin";

export const metadata: Metadata = { title: "Quit risk" };

export default async function Attrition() {
  const { org } = await adminPageContext();
  const repo = getRepo();
  const data = await loadOrgData(repo, org.id);
  if (!data) return null;
  const rows = await attritionTable(repo, data);
  const teamName = new Map(org.teams.map((t) => [t.id, t.name]));

  return (
    <>
      <h1 className="mb-1 text-3xl font-extrabold">Quit risk</h1>
      <p className="mb-4 max-w-3xl text-muted">
        An explainable 0–100 score from each worker&apos;s last 14 days against their own baseline: absences, fatigue, long weeks, late pay,
        team mood (only when 5+ teammates answered), tenure and team silence. Anonymous reports are never used. Every score shows why.
      </p>
      <div className="overflow-x-auto rounded-2xl bg-surface shadow-sm">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Workers sorted by quit-risk score, with the top two reasons and a suggested action</caption>
          <thead className="text-muted">
            <tr>
              <th scope="col" className="p-3">Worker</th>
              <th scope="col" className="p-3">Score</th>
              <th scope="col" className="p-3">Top reasons</th>
              <th scope="col" className="p-3">Suggested action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ worker, result }) => {
              const top = result.drivers.slice(0, 2);
              return (
                <tr key={worker.id} className="border-t border-line align-top">
                  <th scope="row" className="p-3 text-left">
                    <Link href={`/admin/workers/${worker.id}`} className="font-bold text-brand underline">
                      {worker.name}
                    </Link>
                    <span className="block font-normal text-muted">
                      {worker.role} · {teamName.get(worker.teamId)}
                    </span>
                  </th>
                  <td className="p-3">
                    <RiskBadge band={result.band} score={result.score} />
                  </td>
                  <td className="p-3">
                    {top.length === 0 ? (
                      <span className="text-muted">No risk signals</span>
                    ) : (
                      <ul className="flex flex-col gap-0.5">
                        {top.map((d) => (
                          <li key={d.code}>
                            {d.detail} <span className="text-muted">(+{d.points})</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="p-3 font-semibold">{top[0] ? ACTION_LABELS[top[0].action] : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

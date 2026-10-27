import type { Metadata } from "next";
import Link from "next/link";
import { RiskBadge } from "@/components/admin/badges";
import { adminPageContext } from "@/lib/admin-context";
import { formatINR } from "@/lib/i18n";
import { getRepo } from "@/lib/repo";
import { attritionTable, loadOrgData } from "@/lib/services/admin";
import { panel } from "@/components/admin/styles";

export const metadata: Metadata = { title: "Workers" };

export default async function Workers() {
  const { org } = await adminPageContext();
  const repo = getRepo();
  const data = await loadOrgData(repo, org.id);
  if (!data) return null;
  const risk = new Map((await attritionTable(repo, data)).map((r) => [r.worker.id, r.result]));
  const onSite = new Set(data.shifts.filter((s) => !s.checkOut).map((s) => s.workerId));
  const teamName = new Map(org.teams.map((t) => [t.id, t.name]));
  const workers = [...data.workers].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <h1 className="mb-4 text-2xl font-extrabold">Workers</h1>
      <div className={`overflow-x-auto ${panel}`}>
        <table className="w-full text-left text-sm">
          <caption className="sr-only">All workers</caption>
          <thead className="text-navy-950/70">
            <tr>
              <th scope="col" className="p-3">Name</th>
              <th scope="col" className="p-3">Role · team</th>
              <th scope="col" className="p-3">Daily wage</th>
              <th scope="col" className="p-3">Now</th>
              <th scope="col" className="p-3">Quit risk</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => {
              const r = risk.get(w.id);
              return (
                <tr key={w.id} className="border-t border-navy-950/15">
                  <th scope="row" className="p-3 text-left">
                    <Link href={`/admin/workers/${w.id}`} className="font-bold text-slate-600 underline">
                      {w.name}
                    </Link>
                  </th>
                  <td className="p-3">
                    {w.role} · {teamName.get(w.teamId)}
                  </td>
                  <td className="p-3">{formatINR(w.dailyWage)}</td>
                  <td className="p-3">{onSite.has(w.id) ? "On site" : "—"}</td>
                  <td className="p-3">{r && <RiskBadge band={r.band} score={r.score} />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

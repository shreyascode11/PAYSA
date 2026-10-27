import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { StatusPill } from "@/components/ui/StatusPill";
import type { PersonRow } from "@/lib/services/admin";
import type { Team } from "@/lib/types";
import { FatigueBadge, RiskBadge } from "./badges";
import { panelPadded } from "./styles";

const FATIGUE_RANK = { ok: 0, warn: 1, critical: 2 } as const;
const MAX_ROWS = 8;

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

/** "Needs attention first": highest quit risk, then worst recent fatigue. */
export function TeamTable({ people: all, teams }: { people: PersonRow[]; teams: Team[] }) {
  const people = [...all]
    .sort((a, b) => b.risk.score - a.risk.score || FATIGUE_RANK[b.fatigue] - FATIGUE_RANK[a.fatigue])
    .slice(0, MAX_ROWS);
  const teamName = new Map(teams.map((t) => [t.id, t.name]));
  return (
        <section aria-labelledby="team" className={panelPadded}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id="team" className="text-lg font-extrabold text-navy-950">
              Team: needs attention first
            </h2>
            <Link href="/admin/workers" className="flex min-h-10 items-center gap-1 rounded-full border border-navy-950/20 px-4 text-sm font-bold text-slate-600">
              All workers <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Workers sorted by quit risk, with today&apos;s status and fatigue</caption>
              <thead className="text-navy-950/70">
                <tr>
                  <th scope="col" className="py-2 pr-3">Worker</th>
                  <th scope="col" className="py-2 pr-3">Today</th>
                  <th scope="col" className="py-2 pr-3">Fatigue (7 days)</th>
                  <th scope="col" className="py-2 pr-3">Quit risk</th>
                  <th scope="col" className="py-2">Top reason</th>
                </tr>
              </thead>
              <tbody>
                {people.map(({ worker, onSite, fatigue, risk }) => (
                  <tr key={worker.id} className="border-t border-navy-950/10">
                    <th scope="row" className="py-3 pr-3 text-left">
                      <span className="flex items-center gap-3">
                        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sand-300 text-sm font-extrabold text-navy-950">
                          {initials(worker.name)}
                        </span>
                        <span>
                          <Link href={`/admin/workers/${worker.id}`} className="font-bold text-navy-950 hover:underline">
                            {worker.name}
                          </Link>
                          <span className="block font-normal text-navy-950/70">
                            {worker.role} · {teamName.get(worker.teamId)}
                          </span>
                        </span>
                      </span>
                    </th>
                    <td className="py-3 pr-3">{onSite ? <StatusPill tone="ok" label="On site" /> : <StatusPill tone="neutral" label="Not in" />}</td>
                    <td className="py-3 pr-3">
                      <FatigueBadge level={fatigue} />
                    </td>
                    <td className="py-3 pr-3">
                      <RiskBadge band={risk.band} score={risk.score} />
                    </td>
                    <td className="py-3 text-navy-950">{risk.drivers[0]?.detail ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
  );
}

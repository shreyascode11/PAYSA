import "server-only";
import type { Repository } from "../repo/types";
import type { SkillEntry } from "../types";
import { verifiedDaysWorked } from "./worker";

/** Portable, shareable view of a worker. Deliberately excludes phone, wage, team and employer-internal data. */
export interface PublicPassport {
  passportId: string;
  name: string;
  role: string;
  orgName: string;
  sector: string;
  verifiedDays: number;
  skills: (Pick<SkillEntry, "skill" | "level" | "source" | "date"> & { endorsedByName?: string })[];
}

export async function buildPassport(repo: Repository, workerId: string): Promise<PublicPassport | null> {
  const worker = await repo.getWorker(workerId);
  const org = worker && (await repo.getOrg(worker.orgId));
  if (!worker || !org) return null;
  const [skills, verifiedDays] = await Promise.all([repo.listSkills(worker.id), verifiedDaysWorked(repo, worker.id)]);
  const orgNames = new Map((await repo.listOrgs()).map((o) => [o.id, o.name]));
  return {
    passportId: worker.passportId,
    name: worker.name,
    role: worker.role,
    orgName: org.name,
    sector: org.sector,
    verifiedDays,
    skills: skills
      .sort((a, b) => b.level - a.level)
      .map((s) => ({ skill: s.skill, level: s.level, source: s.source, date: s.date, endorsedByName: s.endorsedBy && orgNames.get(s.endorsedBy) })),
  };
}

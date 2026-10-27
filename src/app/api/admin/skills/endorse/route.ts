import { NextResponse } from "next/server";
import { adminApi } from "@/lib/api-auth";
import { getAdminSession } from "@/lib/auth";
import { jsonError, parseJson } from "@/lib/http";
import { getRepo } from "@/lib/repo";
import { sectorConfig } from "@/lib/sectors";
import { localDateKey } from "@/lib/time";
import { endorseSchema } from "@/lib/validation";

export async function POST(req: Request) {
  if (!(await getAdminSession())) return jsonError("unauthorized", 401);
  const parsed = await parseJson(req, endorseSchema);
  if ("error" in parsed) return parsed.error;
  const worker = await getRepo().getWorker(parsed.data.workerId);
  if (!worker) return jsonError("not_found", 404);
  const auth = await adminApi(worker.orgId);
  if (!auth.ok) return auth.res;
  const { repo, org } = auth.value;
  if (!sectorConfig(org.sector).skills.includes(parsed.data.skill)) return jsonError("invalid_input", 400);

  const existing = (await repo.listSkills(worker.id)).find((s) => s.skill === parsed.data.skill);
  await repo.saveSkill({
    id: existing?.id ?? crypto.randomUUID(),
    workerId: worker.id,
    skill: parsed.data.skill,
    level: existing?.level ?? 1,
    source: "employer",
    endorsedBy: org.id,
    date: localDateKey(new Date()),
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}

import "server-only";
import type { NextResponse } from "next/server";
import { getAdminSession, getWorkerSession } from "./auth";
import { jsonError } from "./http";
import { getRepo, type Repository } from "./repo";
import { loadWorker, type WorkerContext } from "./services/worker";
import type { Org } from "./types";

type Result<T> = { ok: true; value: T } | { ok: false; res: NextResponse };

export async function workerApi(): Promise<Result<WorkerContext & { repo: Repository }>> {
  const s = await getWorkerSession();
  if (!s) return { ok: false, res: jsonError("unauthorized", 401) };
  const repo = getRepo();
  const ctx = await loadWorker(repo, s.sub);
  if (!ctx) return { ok: false, res: jsonError("unauthorized", 401) };
  return { ok: true, value: { ...ctx, repo } };
}

/** Admin session plus the org being acted on, which must be one the admin manages. */
export async function adminApi(orgId: string | null | undefined): Promise<Result<{ repo: Repository; org: Org; adminId: string }>> {
  const s = await getAdminSession();
  if (!s) return { ok: false, res: jsonError("unauthorized", 401) };
  if (!orgId || !s.orgIds.includes(orgId)) return { ok: false, res: jsonError("forbidden", 403) };
  const repo = getRepo();
  const org = await repo.getOrg(orgId);
  if (!org) return { ok: false, res: jsonError("not_found", 404) };
  return { ok: true, value: { repo, org, adminId: s.sub } };
}

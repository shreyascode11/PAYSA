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

/**
 * Admin acting on one entity (a report or a worker): 401 without a session, 404 when it doesn't exist,
 * 403 when it belongs to an org the admin doesn't manage.
 */
async function adminForEntity<T extends { orgId: string }>(
  load: (repo: Repository) => Promise<T | undefined>,
): Promise<Result<{ repo: Repository; org: Org; adminId: string; entity: T }>> {
  if (!(await getAdminSession())) return { ok: false, res: jsonError("unauthorized", 401) };
  const entity = await load(getRepo());
  if (!entity) return { ok: false, res: jsonError("not_found", 404) };
  const auth = await adminApi(entity.orgId);
  return auth.ok ? { ok: true, value: { ...auth.value, entity } } : auth;
}

export const adminForReport = (reportId: string) => adminForEntity((repo) => repo.getReport(reportId));
export const adminForWorker = (workerId: string) => adminForEntity((repo) => repo.getWorker(workerId));

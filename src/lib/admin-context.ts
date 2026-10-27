import "server-only";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { requireAdminPage } from "./auth";
import { getRepo } from "./repo";
import type { Org } from "./types";

export const ORG_COOKIE = "fs_org";

/** Current org for admin pages: the sector switcher's choice, if the admin manages it. */
export const adminPageContext = cache(async (): Promise<{ org: Org; orgs: Org[] }> => {
  const session = await requireAdminPage();
  const repo = getRepo();
  const orgs = (await repo.listOrgs()).filter((o) => session.orgIds.includes(o.id));
  const chosen = (await cookies()).get(ORG_COOKIE)?.value;
  const org = orgs.find((o) => o.id === chosen) ?? orgs[0];
  if (!org) notFound();
  return { org, orgs };
});

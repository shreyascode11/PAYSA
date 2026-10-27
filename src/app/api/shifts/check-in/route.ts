import { NextResponse } from "next/server";
import { workerApi } from "@/lib/api-auth";
import { jsonError, parseJson } from "@/lib/http";
import { verifySiteToken } from "@/lib/qr";
import { haversineMeters } from "@/lib/rules/geo";
import { checkInSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const auth = await workerApi();
  if (!auth.ok) return auth.res;
  const { repo, worker } = auth.value;
  const parsed = await parseJson(req, checkInSchema);
  if ("error" in parsed) return parsed.error;
  const input = parsed.data;

  if (await repo.getOpenShift(worker.id)) return jsonError("already_in", 409);

  const sites = await repo.listSites(worker.orgId);
  if (sites.length === 0) return jsonError("no_site", 404);

  let siteId: string;
  if (input.method === "qr") {
    const site = sites.find((s) => s.id === input.siteId);
    if (!site) return jsonError("bad_qr", 400);
    if (!verifySiteToken(site.id, input.qrToken)) return jsonError("expired_qr", 400);
    siteId = site.id;
  } else {
    const ranked = sites
      .map((s) => ({ site: s, d: haversineMeters(input.lat, input.lng, s.lat, s.lng) }))
      .sort((a, b) => a.d - b.d);
    const nearest = ranked[0];
    if (!nearest) return jsonError("no_site", 404);
    if (nearest.d > nearest.site.radiusM) {
      return NextResponse.json(
        { error: "outside", distance: Math.round(nearest.d - nearest.site.radiusM), site: nearest.site.name },
        { status: 400 },
      );
    }
    siteId = nearest.site.id;
  }

  const checkIn = new Date().toISOString();
  await repo.addShift({ id: crypto.randomUUID(), workerId: worker.id, siteId, checkIn, method: input.method });
  return NextResponse.json({ ok: true, checkIn, site: sites.find((s) => s.id === siteId)?.name });
}

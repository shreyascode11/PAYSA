import { NextResponse } from "next/server";
import { workerApi } from "@/lib/api-auth";
import { jsonError } from "@/lib/http";
import { stripJpegMetadata } from "@/lib/image";
import { LIMITS, clientKey, take } from "@/lib/rate-limit";
import { createReport } from "@/lib/services/reports";
import { MAX_PHOTO_BYTES, reportSchema } from "@/lib/validation";

async function readPhoto(file: FormDataEntryValue | null): Promise<string | undefined | "invalid"> {
  if (!(file instanceof Blob) || file.size === 0) return undefined;
  if (file.size > MAX_PHOTO_BYTES) return "invalid";
  // Client re-encodes to JPEG; we strip metadata again server-side and never trust the browser.
  const clean = stripJpegMetadata(new Uint8Array(await file.arrayBuffer()));
  if (!clean) return "invalid";
  return `data:image/jpeg;base64,${Buffer.from(clean).toString("base64")}`;
}

export async function POST(req: Request) {
  const auth = await workerApi();
  if (!auth.ok) return auth.res;
  if (!take(clientKey(req, "report"), LIMITS.report)) return jsonError("rate_limited", 429);

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError("invalid_input", 400);
  const parsed = reportSchema.safeParse({
    type: form.get("type"),
    category: form.get("category"),
    text: form.get("text"),
    textEn: form.get("textEn") || undefined,
    lang: form.get("lang"),
    anonymous: form.get("anonymous") !== "false",
    siteId: form.get("siteId") || undefined,
  });
  if (!parsed.success) return jsonError("invalid_input", 400);
  const photoUrl = await readPhoto(form.get("photo"));
  if (photoUrl === "invalid") return jsonError("invalid_photo", 400);

  const { repo, worker, org } = auth.value;
  const input = parsed.data;
  // Manager feedback is always anonymous: fear of retaliation is the whole problem it solves.
  const anonymous = input.type === "manager_feedback" ? true : input.anonymous;
  let siteId = input.siteId;
  if (siteId && !(await repo.listSites(org.id)).some((s) => s.id === siteId)) siteId = undefined;
  if (!siteId) {
    const recent = await repo.listShifts({ workerId: worker.id, since: new Date(Date.now() - 7 * 86_400_000).toISOString() });
    siteId = recent.sort((a, b) => b.checkIn.localeCompare(a.checkIn))[0]?.siteId;
  }

  const report = await createReport(repo, {
    org,
    workerId: worker.id,
    type: input.type,
    category: input.category,
    text: input.text,
    textEn: input.textEn,
    lang: input.lang,
    anonymous,
    siteId,
    photoUrl,
  });
  return NextResponse.json({ trackingId: report.trackingId }, { status: 201 });
}

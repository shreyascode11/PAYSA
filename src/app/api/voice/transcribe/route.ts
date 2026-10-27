import { NextResponse } from "next/server";
import { aiEnabled, transcribeAudio } from "@/lib/ai/gemini";
import { workerApi } from "@/lib/api-auth";
import { jsonError } from "@/lib/http";
import { isLang } from "@/lib/lang";
import { LIMITS, clientKey, take } from "@/lib/rate-limit";
import { AUDIO_TYPES, MAX_AUDIO_BYTES } from "@/lib/validation";

export async function POST(req: Request) {
  const auth = await workerApi();
  if (!auth.ok) return auth.res;
  if (!take(clientKey(req, "voice"), LIMITS.voice)) return jsonError("rate_limited", 429);
  if (!aiEnabled()) return jsonError("ai_unavailable", 503);

  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  const hint = form?.get("lang");
  if (!(audio instanceof Blob) || audio.size === 0) return jsonError("invalid_input", 400);
  if (audio.size > MAX_AUDIO_BYTES) return jsonError("too_large", 413);
  const mime = audio.type.split(";")[0] ?? "";
  if (!(AUDIO_TYPES as readonly string[]).includes(mime)) return jsonError("unsupported_type", 415);

  const result = await transcribeAudio(new Uint8Array(await audio.arrayBuffer()), mime, isLang(hint) ? hint : auth.value.worker.lang);
  // The audio is never stored: it lives only for the length of this request.
  if (!result) return jsonError("ai_unavailable", 503);
  return NextResponse.json(result);
}

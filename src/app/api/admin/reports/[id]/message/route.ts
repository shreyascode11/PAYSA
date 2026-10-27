import { NextResponse } from "next/server";
import { adminForReport } from "@/lib/api-auth";
import { parseJson } from "@/lib/http";
import { addMessage } from "@/lib/services/reports";
import { messageSchema } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await adminForReport((await params).id);
  if (!auth.ok) return auth.res;
  const parsed = await parseJson(req, messageSchema);
  if ("error" in parsed) return parsed.error;
  await auth.value.repo.saveReport(addMessage(auth.value.entity, "admin", parsed.data.text));
  return NextResponse.json({ ok: true }, { status: 201 });
}

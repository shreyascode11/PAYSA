import "server-only";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";

export const jsonError = (error: string, status: number): NextResponse => NextResponse.json({ error }, { status });

export async function parseJson<T>(req: Request, schema: ZodType<T>): Promise<{ data: T } | { error: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: jsonError("invalid_json", 400) };
  }
  const r = schema.safeParse(body);
  if (!r.success) return { error: jsonError("invalid_input", 400) };
  return { data: r.data };
}

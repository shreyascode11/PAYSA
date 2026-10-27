import { NextResponse, type NextRequest } from "next/server";

/** CSRF defence in depth (cookies are already SameSite=Lax): mutating API calls must be same-origin. */
export function middleware(req: NextRequest) {
  if (req.method === "GET" || req.method === "HEAD") return NextResponse.next();
  const origin = req.headers.get("origin");
  if (!origin) return NextResponse.next();
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    if (new URL(origin).host === host) return NextResponse.next();
  } catch {
    // fall through to rejection
  }
  return NextResponse.json({ error: "bad_origin" }, { status: 403 });
}

export const config = { matcher: "/api/:path*" };

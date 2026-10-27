import { NextResponse, type NextRequest } from "next/server";

const isDev = process.env.NODE_ENV !== "production";

/** Per-request nonce CSP: only scripts Next.js renders with this nonce (and what they load) may run. */
function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Inline style attributes (computed widths/heights) need this; it cannot execute code.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

/** CSRF defence in depth (cookies are already SameSite=Lax): mutating API calls must be same-origin. */
function isCrossOrigin(req: NextRequest): boolean {
  if (req.method === "GET" || req.method === "HEAD") return false;
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return isCrossOrigin(req) ? NextResponse.json({ error: "bad_origin" }, { status: 403 }) : NextResponse.next();
  }
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);
  // Next.js reads the CSP from the request headers to stamp its own scripts with the nonce.
  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", csp);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  matcher: [
    "/api/:path*",
    { source: "/((?!_next/static|_next/image|icon.svg).*)", missing: [{ type: "header", key: "next-router-prefetch" }] },
  ],
};

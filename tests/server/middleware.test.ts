import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "@/middleware";

describe("middleware", () => {
  it("blocks cross-origin mutating API calls", () => {
    const res = middleware(new NextRequest("http://localhost:3000/api/pulse", { method: "POST", headers: { origin: "https://evil.example", host: "localhost:3000" } }));
    expect(res.status).toBe(403);
  });

  it("allows same-origin and safe API calls", () => {
    const same = middleware(new NextRequest("http://localhost:3000/api/pulse", { method: "POST", headers: { origin: "http://localhost:3000", host: "localhost:3000" } }));
    const get = middleware(new NextRequest("http://localhost:3000/api/me/summary", { headers: { origin: "https://evil.example" } }));
    expect(same.status).toBe(200);
    expect(get.status).toBe(200);
  });

  it("sets a fresh nonce-based CSP on every page", () => {
    const a = middleware(new NextRequest("http://localhost:3000/w/home")).headers.get("content-security-policy") ?? "";
    const b = middleware(new NextRequest("http://localhost:3000/w/home")).headers.get("content-security-policy") ?? "";
    expect(a).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(a).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(a).toContain("frame-ancestors 'none'");
    expect(a).not.toBe(b);
  });
});

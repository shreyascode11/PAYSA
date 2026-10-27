import { beforeEach, describe, expect, it, vi } from "vitest";

const jar = new Map<string, string>();
let requestHeaders = new Headers();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (n: string) => (jar.has(n) ? { name: n, value: jar.get(n) } : undefined),
    set: (n: string, v: string) => void jar.set(n, v),
    delete: (n: string) => void jar.delete(n),
  }),
  headers: async () => requestHeaders,
}));

beforeEach(() => {
  jar.clear();
  requestHeaders = new Headers();
});

describe("session cookies", () => {
  it("sets, reads and clears the worker session", async () => {
    const auth = await import("@/lib/auth");
    await auth.setSessionCookie({ role: "worker", sub: "w1", orgId: "o1" });
    expect(await auth.getWorkerSession()).toEqual({ role: "worker", sub: "w1", orgId: "o1" });
    expect(await auth.getAdminSession()).toBeNull();
    await auth.clearSessionCookie();
    expect(jar.has(auth.SESSION_COOKIE)).toBe(false);
  });
});

describe("language preference", () => {
  it("reads a valid language cookie and falls back to English", async () => {
    const { getLang } = await import("@/lib/locale");
    jar.set("fs_lang", "ta");
    expect(await getLang()).toBe("ta");
  });

  it("ignores unknown languages", async () => {
    vi.resetModules();
    const { getLang } = await import("@/lib/locale");
    jar.set("fs_lang", "fr");
    expect(await getLang()).toBe("en");
  });
});

describe("request origin", () => {
  it("prefers proxy headers and defaults to https", async () => {
    const { requestOrigin } = await import("@/lib/origin");
    requestHeaders = new Headers({ "x-forwarded-host": "paysa.example", host: "internal:8080" });
    expect(await requestOrigin()).toBe("https://paysa.example");
    requestHeaders = new Headers({ host: "localhost:3000" });
    expect(await requestOrigin()).toBe("http://localhost:3000");
  });
});

describe("QR check-in link", () => {
  it("embeds site and today's token in the check-in URL", async () => {
    const { checkinUrl, todaysSiteToken } = await import("@/lib/qr");
    const url = new URL(checkinUrl("https://paysa.example", "site-1", todaysSiteToken("site-1")));
    expect(url.pathname).toBe("/w/checkin");
    expect(url.searchParams.get("site")).toBe("site-1");
    expect(url.searchParams.get("t")).toHaveLength(12);
  });
});

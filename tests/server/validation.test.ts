import { describe, expect, it } from "vitest";
import {
  announcementSchema,
  checkInSchema,
  pulseSchema,
  reportSchema,
  reportUpdateSchema,
  workerLoginSchema,
} from "@/lib/validation";

describe("input validation", () => {
  it("accepts well-formed logins and rejects malformed ones", () => {
    expect(workerLoginSchema.safeParse({ phone: "9000000001", pin: "1234" }).success).toBe(true);
    for (const bad of [{ phone: "900", pin: "1234" }, { phone: "9000000001", pin: "12a4" }, { phone: "9000000001" }]) {
      expect(workerLoginSchema.safeParse(bad).success).toBe(false);
    }
  });

  it("requires the fields of the chosen check-in method", () => {
    expect(checkInSchema.safeParse({ method: "geo", lat: 12.8, lng: 80.1 }).success).toBe(true);
    expect(checkInSchema.safeParse({ method: "qr", siteId: "site-1", qrToken: "abcdefgh" }).success).toBe(true);
    expect(checkInSchema.safeParse({ method: "geo", lat: 120, lng: 80 }).success).toBe(false);
    expect(checkInSchema.safeParse({ method: "qr", siteId: "site-1" }).success).toBe(false);
    expect(checkInSchema.safeParse({ method: "manual" }).success).toBe(false);
  });

  it("rejects report categories that could carry injection payloads", () => {
    const base = { type: "hazard", category: "fall_height", text: "x", lang: "en", anonymous: true };
    expect(reportSchema.safeParse(base).success).toBe(true);
    expect(reportSchema.safeParse({ ...base, category: "<script>" }).success).toBe(false);
    expect(reportSchema.safeParse({ ...base, text: "   " }).success).toBe(false);
    expect(reportSchema.safeParse({ ...base, lang: "fr" }).success).toBe(false);
  });

  it("only accepts real pulse scores and severities", () => {
    expect(pulseSchema.safeParse({ score: 5 }).success).toBe(true);
    expect(pulseSchema.safeParse({ score: 6 }).success).toBe(false);
    expect(pulseSchema.safeParse({ score: 2.5 }).success).toBe(false);
    expect(reportUpdateSchema.safeParse({ status: "resolved", severity: 4 }).success).toBe(true);
    expect(reportUpdateSchema.safeParse({ status: "closed" }).success).toBe(false);
    expect(reportUpdateSchema.safeParse({ status: "resolved", severity: 5 }).success).toBe(false);
  });

  it("limits notices and their translations to 280 characters", () => {
    const ok = { orgId: "org-con", text: "Water break", lang: "en", translations: { ta: "தண்ணீர்" } };
    expect(announcementSchema.safeParse(ok).success).toBe(true);
    expect(announcementSchema.safeParse({ ...ok, translations: { hi: "x".repeat(281) } }).success).toBe(false);
  });
});

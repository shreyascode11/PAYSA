import { describe, expect, it } from "vitest";
import {
  TRACKING_ID_PATTERN,
  canShowAggregate,
  generateTrackingId,
  normalizeTrackingId,
  reportIdentity,
  roundToHour,
} from "@/lib/rules/anonymity";

describe("canShowAggregate", () => {
  it("hides groups smaller than 5", () => {
    expect(canShowAggregate(0)).toBe(false);
    expect(canShowAggregate(4)).toBe(false);
  });
  it("shows groups of 5 or more", () => {
    expect(canShowAggregate(5)).toBe(true);
    expect(canShowAggregate(40)).toBe(true);
  });
});

describe("generateTrackingId", () => {
  it("matches PS-XXXXXX with no ambiguous characters", () => {
    for (let i = 0; i < 200; i++) {
      const id = generateTrackingId();
      expect(id).toMatch(TRACKING_ID_PATTERN);
      expect(id.slice(3)).not.toMatch(/[01OIL]/);
    }
  });

  it("is unique across many draws", () => {
    const ids = new Set(Array.from({ length: 5000 }, generateTrackingId));
    expect(ids.size).toBe(5000);
  });

  it("normalizes user-typed codes", () => {
    expect(normalizeTrackingId(" ps-7k2q9m ")).toBe("PS-7K2Q9M");
    expect(normalizeTrackingId("7k2q9m")).toBe("PS-7K2Q9M");
  });
});

describe("report identity", () => {
  const now = new Date("2026-10-05T09:47:31.123Z");

  it("rounds anonymous timestamps to the hour", () => {
    expect(roundToHour(now)).toBe("2026-10-05T09:00:00.000Z");
  });

  it("drops workerId and coarsens time when anonymous", () => {
    const r = reportIdentity({ anonymous: true, workerId: "w1", now });
    expect(r).toEqual({ createdAt: "2026-10-05T09:00:00.000Z" });
    expect("workerId" in r).toBe(false);
  });

  it("keeps workerId and exact time when named", () => {
    expect(reportIdentity({ anonymous: false, workerId: "w1", now })).toEqual({
      workerId: "w1",
      createdAt: now.toISOString(),
    });
  });
});

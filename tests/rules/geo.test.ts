import { describe, expect, it } from "vitest";
import { haversineMeters, isInsideSite } from "@/lib/rules/geo";

const site = { lat: 12.8231, lng: 80.0444, radiusM: 150 };

describe("geo", () => {
  it("measures zero distance to itself", () => {
    expect(haversineMeters(site.lat, site.lng, site.lat, site.lng)).toBe(0);
  });

  it("measures a known distance (~111 km per degree of latitude)", () => {
    expect(haversineMeters(0, 0, 1, 0)).toBeGreaterThan(111_000);
    expect(haversineMeters(0, 0, 1, 0)).toBeLessThan(111_400);
  });

  it("accepts a point inside the radius", () => {
    expect(isInsideSite(12.8238, 80.0447, site)).toBe(true); // ~85 m
  });

  it("rejects a point outside the radius", () => {
    expect(isInsideSite(12.8261, 80.0444, site)).toBe(false); // ~330 m
  });

  it("treats the exact boundary as inside", () => {
    const d = haversineMeters(site.lat, site.lng, 12.8241, 80.0444);
    expect(isInsideSite(12.8241, 80.0444, { ...site, radiusM: d })).toBe(true);
  });
});

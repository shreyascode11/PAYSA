import { describe, expect, it } from "vitest";
import { buildSeed } from "@/data/seed";
import { MemoryRepository } from "@/lib/repo/memory";
import { buildPassport } from "@/lib/services/passport";

describe("public Skill Passport", () => {
  const repo = new MemoryRepository(buildSeed(new Date("2026-10-27T11:00:00+05:30"), "pin", "pw"));

  it("shows skills, endorsements and verified days but never phone or wage", async () => {
    const p = await buildPassport(repo, "w-c01");
    expect(p?.verifiedDays).toBeGreaterThan(20);
    expect(p?.skills.find((s) => s.skill === "masonry")?.endorsedByName).toBe("Sri Vinayaka Builders");
    const json = JSON.stringify(p);
    expect(json).not.toContain("9000000001");
    expect(json).not.toMatch(/wage|hourlyRate|pinHash|phone/i);
  });
});

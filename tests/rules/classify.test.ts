import { describe, expect, it } from "vitest";
import { classifyReport } from "@/lib/rules/classify";
import { SECTORS } from "@/lib/sectors";

const con = SECTORS.construction.hazardCategories;
const col = SECTORS.college.hazardCategories;

describe("classifyReport (AI fallback)", () => {
  it("finds the category and flags a near-miss fall as critical", () => {
    const r = classifyReport("No guard rail on 5th floor scaffolding, someone almost fell", "hazard", con, "other");
    expect(r).toEqual({ category: "fall_height", severity: 4 });
  });

  it("understands Tamil and Hindi keywords", () => {
    expect(classifyReport("மின் கம்பி திறந்து கிடக்கிறது", "hazard", con, "other").category).toBe("electrical");
    expect(classifyReport("बिना दस्ताने के एसिड से सफ़ाई", "hazard", col, "other")).toEqual({
      category: "chemical_cleaning",
      severity: 3,
    });
  });

  it("keeps the worker's chosen category unless it is 'other'", () => {
    expect(classifyReport("slippery stairs", "hazard", col, "lifting").category).toBe("lifting");
  });

  it("never returns a category outside the allowed list", () => {
    expect(classifyReport("acid burns", "hazard", con, "other").category).not.toBe("chemical_cleaning");
  });

  it("gives grievances a lower baseline severity", () => {
    expect(classifyReport("salary late", "grievance", ["pay", "other"], "pay")).toEqual({ category: "pay", severity: 1 });
    expect(classifyReport("supervisor threatens to cut pay", "manager_feedback", ["manager"], "manager").severity).toBe(2);
  });
});

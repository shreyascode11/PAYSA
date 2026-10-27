import type { Sector } from "./types";

export interface SectorConfig {
  label: string;
  hazardCategories: readonly string[];
  shiftPattern: "day" | "rotating";
  standardDailyHours: number;
  otMultiplier: number;
  skills: readonly string[];
}

/**
 * One engine, many workplaces: a new sector (hospital, factory…) is just another entry here
 * plus its category/skill labels in the locale files.
 */
export const SECTORS: Record<Sector, SectorConfig> = {
  construction: {
    label: "Construction Site",
    hazardCategories: ["fall_height", "ppe_missing", "electrical", "machinery", "heat", "collapse", "other"],
    shiftPattern: "day",
    standardDailyHours: 8,
    otMultiplier: 2,
    skills: ["masonry", "bar_bending", "scaffolding", "welding", "electrical", "plumbing", "safety_induction"],
  },
  college: {
    label: "College Campus Staff",
    hazardCategories: ["wet_floor", "chemical_cleaning", "electrical", "lifting", "harassment", "other"],
    shiftPattern: "rotating",
    standardDailyHours: 8,
    otMultiplier: 2,
    skills: ["housekeeping", "gardening", "electrical_maintenance", "lab_assistance", "security", "plumbing"],
  },
};

export const GRIEVANCE_CATEGORIES = ["pay", "hours", "leave", "behaviour", "facilities", "other"] as const;
export const FEEDBACK_CATEGORIES = ["manager", "conditions", "other"] as const;

export function sectorConfig(sector: Sector): SectorConfig {
  return SECTORS[sector];
}

export function categoriesFor(type: "hazard" | "grievance" | "manager_feedback", sector: Sector): readonly string[] {
  if (type === "hazard") return SECTORS[sector].hazardCategories;
  if (type === "grievance") return GRIEVANCE_CATEGORIES;
  return FEEDBACK_CATEGORIES;
}

import { describe, expect, it } from "vitest";
import { assessFatigueDay, assessFatigueRange } from "@/lib/rules/fatigue";
import { dayShift, shift } from "../helpers";

describe("assessFatigueDay", () => {
  it("is ok for a normal day and for rest days", () => {
    const s = [dayShift("2026-10-05", 8)];
    expect(assessFatigueDay(s, "2026-10-05")).toEqual({ level: "ok", reasons: [], factors: [] });
    expect(assessFatigueDay(s, "2026-10-06").level).toBe("ok");
  });

  it("warns on a shift over 10h and is critical over 12h", () => {
    const warn = assessFatigueDay([dayShift("2026-10-05", 10.5)], "2026-10-05");
    expect(warn.level).toBe("warn");
    expect(warn.reasons).toEqual(["Shift of 10.5h (limit 10)"]);

    const crit = assessFatigueDay([dayShift("2026-10-05", 13)], "2026-10-05");
    expect(crit.level).toBe("critical");
    expect(crit.reasons).toEqual(["Shift of 13h (limit 12)"]);
  });

  it("does not flag exactly 10h", () => {
    expect(assessFatigueDay([dayShift("2026-10-05", 10)], "2026-10-05").level).toBe("ok");
  });

  it("warns on under 11h rest and is critical under 8h", () => {
    const warn = [shift("2026-10-05T08:00", "2026-10-05T16:00"), shift("2026-10-06T02:00", "2026-10-06T08:00")];
    const w = assessFatigueDay(warn, "2026-10-06");
    expect(w.level).toBe("warn");
    expect(w.reasons).toEqual(["Only 10h rest between shifts (minimum 11)"]);

    const crit = [shift("2026-10-05T08:00", "2026-10-05T20:00"), shift("2026-10-06T03:00", "2026-10-06T09:00")];
    const c = assessFatigueDay(crit, "2026-10-06");
    expect(c.level).toBe("critical");
    expect(c.reasons).toContain("Only 7h rest between shifts (minimum 8)");
  });

  it("warns after more than 6 consecutive days", () => {
    const days = ["05", "06", "07", "08", "09", "10", "11"].map((d) => dayShift(`2026-10-${d}`, 6));
    expect(assessFatigueDay(days, "2026-10-10").level).toBe("ok"); // 6 days
    const r = assessFatigueDay(days, "2026-10-11");
    expect(r.level).toBe("warn");
    expect(r.reasons).toEqual(["Worked 7 days in a row (limit 6)"]);
  });

  it("warns over 54h a week and is critical over 60h", () => {
    const warn = ["05", "06", "07", "08", "09", "10"].map((d) => dayShift(`2026-10-${d}`, 9.5)); // 57h
    const w = assessFatigueDay(warn, "2026-10-10");
    expect(w.level).toBe("warn");
    expect(w.reasons).toEqual(["Worked 57h this week (limit 54)"]);

    const crit = ["05", "06", "07", "08", "09", "10"].map((d) => dayShift(`2026-10-${d}`, 10.5)); // 63h
    const c = assessFatigueDay(crit, "2026-10-10");
    expect(c.level).toBe("critical");
    expect(c.reasons).toContain("Worked 63h this week (limit 60)");
    expect(c.reasons).toContain("Shift of 10.5h (limit 10)");
  });

  it("counts week-to-date hours from Monday only", () => {
    // Previous week's Sunday hours must not count toward Monday's week.
    const s = [dayShift("2026-10-04", 12), dayShift("2026-10-05", 8)];
    expect(assessFatigueDay(s, "2026-10-05").factors.find((f) => f.code === "weekly_hours")).toBeUndefined();
  });

  it("assessFatigueRange returns a result per day", () => {
    const r = assessFatigueRange([dayShift("2026-10-05", 13)], ["2026-10-05", "2026-10-06"]);
    expect(r["2026-10-05"]?.level).toBe("critical");
    expect(r["2026-10-06"]?.level).toBe("ok");
  });
});

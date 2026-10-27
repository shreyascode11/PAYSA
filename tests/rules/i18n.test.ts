import { describe, expect, it } from "vitest";
import { dictionaries, flatKeys, t } from "@/lib/i18n";

describe("locale files", () => {
  const enKeys = flatKeys(dictionaries.en);

  it.each(["ta", "hi"] as const)("%s covers every English key", (lang) => {
    const keys = new Set(flatKeys(dictionaries[lang]));
    expect(enKeys.filter((k) => !keys.has(k))).toEqual([]);
  });

  it("interpolates variables", () => {
    expect(t("en", "home.hello", { name: "Ravi" })).toBe("Hello, Ravi");
    expect(t("hi", "home.hello", { name: "Ravi" })).toBe("नमस्ते, Ravi");
  });

  it("falls back to the key for unknown strings", () => {
    expect(t("ta", "nope.missing")).toBe("nope.missing");
  });
});

describe("formatTime", () => {
  it("uses spoken day periods in Tamil and Hindi instead of AM/PM", async () => {
    const { formatTime } = await import("@/lib/i18n");
    const morning = "2026-10-26T01:39:00Z"; // 07:09 IST
    const evening = "2026-10-26T11:45:00Z"; // 17:15 IST
    expect(formatTime(morning, "ta")).toBe("காலை 7:09");
    expect(formatTime(evening, "hi")).toBe("शाम 5:15");
    expect(formatTime(morning, "hi")).not.toMatch(/am|pm/i);
    expect(formatTime(morning, "en")).toMatch(/7:09/);
  });
});

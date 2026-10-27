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

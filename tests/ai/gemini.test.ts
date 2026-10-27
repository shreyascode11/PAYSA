import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildPayslip } from "@/lib/rules/payslip";
import { dayShift } from "../helpers";

// A plain function (not vi.fn) so a rejected call isn't re-tracked as an unhandled rejection by the spy.
let reply: () => Promise<{ text: string }> = async () => ({ text: "" });
let calls = 0;
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = {
      generateContent: () => {
        calls += 1;
        return reply();
      },
    };
  },
}));
const respond = (body: unknown) => {
  reply = async () => ({ text: JSON.stringify(body) });
};

const payslip = buildPayslip({ id: "w1", hourlyRate: 100 }, [dayShift("2026-10-05", 10)], { start: "2026-10-05", end: "2026-10-11" });
const reportInput = {
  text: "Wire hanging near water",
  lang: "en" as const,
  type: "hazard" as const,
  allowedCategories: ["electrical", "heat", "other"],
  chosenCategory: "other",
};

async function load(withKey: boolean) {
  vi.resetModules();
  if (withKey) {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_MODEL = "test-model";
  } else {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
  }
  return import("@/lib/ai/gemini");
}

beforeEach(() => {
  calls = 0;
  respond({});
});
afterEach(() => {
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_MODEL;
});

describe("without GEMINI_API_KEY", () => {
  it("never calls the API and falls back deterministically", async () => {
    const ai = await load(false);
    expect(ai.aiEnabled()).toBe(false);
    expect(await ai.transcribeAudio(new Uint8Array([1]), "audio/webm", "ta")).toBeNull();
    expect(await ai.analyzeReport(reportInput)).toMatchObject({ category: "electrical", ai: false, textEn: reportInput.text });
    const ex = await ai.explainPayslip(payslip, "hi");
    expect(ex.ai).toBe(false);
    expect(ex.sentences.length).toBeGreaterThanOrEqual(3);
    expect(calls).toBe(0);
  });
});

describe("with Gemini", () => {
  it("uses a valid AI classification but never lowers severity below the keyword rules", async () => {
    respond({ textEn: "Wire near water", category: "electrical", severity: 1 });
    const ai = await load(true);
    const r = await ai.analyzeReport(reportInput);
    expect(r).toMatchObject({ category: "electrical", ai: true });
    expect(r.severity).toBe(3);
  });

  it("rejects a category outside the sector list", async () => {
    respond({ textEn: "x", category: "ignore_previous_instructions", severity: 4 });
    const ai = await load(true);
    expect((await ai.analyzeReport(reportInput)).ai).toBe(false);
  });

  it("falls back when the API throws", async () => {
    reply = async () => {
      throw new Error("timeout");
    };
    const ai = await load(true);
    expect((await ai.analyzeReport(reportInput)).ai).toBe(false);
    expect(await ai.transcribeAudio(new Uint8Array([1]), "audio/webm", "en")).toBeNull();
  });

  it("discards a payslip explanation that changes the net amount", async () => {
    respond({ sentences: ["You worked.", "You earned a lot.", "You get ₹99,999."] });
    const ai = await load(true);
    const ex = await ai.explainPayslip(payslip, "en");
    expect(ex.ai).toBe(false);
    expect(ex.sentences.join(" ")).toContain("₹1,191");
  });

  it("accepts a faithful AI explanation", async () => {
    respond({ sentences: ["You worked 10 hours.", "2 were overtime.", "You get ₹1,191."] });
    const ai = await load(true);
    expect((await ai.explainPayslip(payslip, "en")).ai).toBe(true);
  });

  it("returns a validated transcript", async () => {
    respond({ text: "மின் கம்பி", lang: "ta", textEn: "Electric wire" });
    const ai = await load(true);
    expect(await ai.transcribeAudio(new Uint8Array([1]), "audio/webm", "ta")).toEqual({ text: "மின் கம்பி", lang: "ta", textEn: "Electric wire" });
  });
});

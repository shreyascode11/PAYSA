"use client";

import { Angry, Annoyed, Frown, Laugh, Smile, type LucideIcon } from "lucide-react";
import { useState } from "react";

const FACES: { score: number; Icon: LucideIcon }[] = [
  { score: 1, Icon: Angry },
  { score: 2, Icon: Frown },
  { score: 3, Icon: Annoyed },
  { score: 4, Icon: Smile },
  { score: 5, Icon: Laugh },
];

interface Props {
  question: string;
  faceLabels: Record<number, string>;
  thanks: string;
  already: string;
  errorText: string;
  answered: boolean;
}

/** One-tap anonymous weekly mood. */
export function PulseForm({ question, faceLabels, thanks, already, errorText, answered }: Props) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "already" | "error">(answered ? "already" : "idle");

  async function send(score: number) {
    setState("busy");
    try {
      const res = await fetch("/api/pulse", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ score }) });
      setState(res.ok ? "done" : res.status === 409 ? "already" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <fieldset>
      <legend className="mb-3 text-xl font-extrabold">{question}</legend>
      {state === "done" || state === "already" ? (
        <p role="status" className="rounded-3xl bg-mint-100 p-5 text-lg font-bold text-ink-900">
          {state === "done" ? thanks : already}
        </p>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {FACES.map(({ score, Icon }) => (
            <button
              key={score}
              type="button"
              disabled={state === "busy"}
              onClick={() => void send(score)}
              className="glass-dark flex min-h-28 flex-col items-center justify-center gap-2 rounded-3xl p-1 text-center text-sm font-bold text-cream-50 transition hover:bg-safety-500 hover:text-ink-900 focus-visible:bg-safety-500 focus-visible:text-ink-900"
            >
              <Icon aria-hidden="true" className="size-10" strokeWidth={1.75} />
              <span className="leading-tight">{faceLabels[score]}</span>
            </button>
          ))}
        </div>
      )}
      {state === "error" && (
        <p role="alert" className="mt-2 rounded-3xl bg-critical p-3 font-bold text-cream-50">
          {errorText}
        </p>
      )}
    </fieldset>
  );
}

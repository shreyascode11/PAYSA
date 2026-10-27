"use client";

import { Angry, Annoyed, Frown, Laugh, Smile, type LucideIcon } from "lucide-react";
import { useState } from "react";

const FACES: { score: number; Icon: LucideIcon; cls: string }[] = [
  { score: 1, Icon: Angry, cls: "text-danger" },
  { score: 2, Icon: Frown, cls: "text-danger" },
  { score: 3, Icon: Annoyed, cls: "text-warn" },
  { score: 4, Icon: Smile, cls: "text-ok" },
  { score: 5, Icon: Laugh, cls: "text-ok" },
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
      <legend className="mb-3 text-xl font-bold">{question}</legend>
      {state === "done" || state === "already" ? (
        <p role="status" className="rounded-2xl bg-ok-soft p-4 text-lg font-semibold text-ok">
          {state === "done" ? thanks : already}
        </p>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {FACES.map(({ score, Icon, cls }) => (
            <button
              key={score}
              type="button"
              disabled={state === "busy"}
              onClick={() => void send(score)}
              className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-line bg-surface p-1 text-center text-sm font-semibold"
            >
              <Icon aria-hidden="true" className={`size-10 ${cls}`} />
              <span className="leading-tight">{faceLabels[score]}</span>
            </button>
          ))}
        </div>
      )}
      {state === "error" && (
        <p role="alert" className="mt-2 font-semibold text-danger">
          {errorText}
        </p>
      )}
    </fieldset>
  );
}

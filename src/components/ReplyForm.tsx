"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

interface Props {
  endpoint: string;
  label: string;
  submit: string;
  errorText: string;
  /** Dark on the worker tracking page, light on the admin dashboard. */
  tone: "dark" | "light";
}

const TONES = {
  dark: {
    field: "border-ivory-50/20 bg-navy-900 text-ivory-50",
    button: "bg-sand-300 text-navy-950",
    error: "bg-critical text-ivory-50",
  },
  light: {
    field: "border-navy-950/20 bg-ivory-50 text-navy-950",
    button: "bg-navy-950 text-ivory-50",
    error: "bg-critical text-ivory-50",
  },
} as const;

/** Message box for the anonymous report chat (used by worker and admin sides). */
export function ReplyForm({ endpoint, label, submit, errorText, tone }: Props) {
  const c = TONES[tone];
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
      if (res.ok) {
        setText("");
        router.refresh();
      } else setError(true);
    } catch {
      setError(true);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <label htmlFor="reply" className="font-semibold">
        {label}
      </label>
      <textarea
        id="reply"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={1000}
        required
        className={`rounded-3xl border p-4 ${c.field}`}
      />
      {error && (
        <p role="alert" className={`rounded-2xl px-4 py-2 font-bold ${c.error}`}>
          {errorText}
        </p>
      )}
      <button type="submit" disabled={busy} className={`flex min-h-12 items-center justify-center gap-2 self-start rounded-full px-6 font-bold disabled:opacity-60 ${c.button}`}>
        <Send aria-hidden="true" className="size-5" />
        {submit}
      </button>
    </form>
  );
}

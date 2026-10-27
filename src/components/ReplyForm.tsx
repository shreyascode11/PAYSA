"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

interface Props {
  endpoint: string;
  label: string;
  submit: string;
  errorText: string;
}

/** Message box for the anonymous report chat (used by worker and admin sides). */
export function ReplyForm({ endpoint, label, submit, errorText }: Props) {
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
        className="rounded-3xl border border-line bg-surface p-4 text-ink"
      />
      {error && (
        <p role="alert" className="font-bold text-danger">
          {errorText}
        </p>
      )}
      <button type="submit" disabled={busy} className="flex min-h-12 items-center justify-center gap-2 self-start rounded-full bg-brand px-6 font-bold text-brand-ink disabled:opacity-60">
        <Send aria-hidden="true" className="size-5" />
        {submit}
      </button>
    </form>
  );
}

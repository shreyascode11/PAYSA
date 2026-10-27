"use client";

import { ArrowRight, OctagonAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export interface LoginField {
  name: string;
  label: string;
  type: "tel" | "password" | "email";
  inputMode?: "numeric" | "email";
  autoComplete: string;
  pattern?: string;
  maxLength?: number;
}

interface Props {
  endpoint: string;
  fields: LoginField[];
  submitLabel: string;
  messages: { invalid: string; tooMany: string; generic: string; offline: string };
  /** Same-app path to return to after login (already validated by the page). */
  next?: string;
}

/** Credential form styled for the dark ID badge. */
export function LoginForm({ endpoint, fields, submitLabel, messages, next }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { redirect?: string; error?: string };
      if (res.ok && data.redirect) {
        router.replace(next ?? data.redirect);
        router.refresh();
        return;
      }
      setError(res.status === 429 ? messages.tooMany : res.status === 401 || res.status === 400 ? messages.invalid : messages.generic);
    } catch {
      setError(navigator.onLine ? messages.generic : messages.offline);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {fields.map((f) => (
        <label key={f.name} className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-ivory-50/75">{f.label}</span>
          <input
            name={f.name}
            type={f.type}
            inputMode={f.inputMode}
            autoComplete={f.autoComplete}
            pattern={f.pattern}
            maxLength={f.maxLength}
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "login-error" : undefined}
            className="min-h-13 rounded-2xl bg-ivory-50/8 px-4 text-lg font-semibold tracking-[0.08em] text-ivory-50 ring-1 ring-ivory-50/20 transition focus:bg-ivory-50/12 focus:outline-none focus:ring-2 focus:ring-sand-300"
          />
        </label>
      ))}
      <div id="login-error" role="alert" aria-live="polite" className="min-h-0">
        {error && (
          <p className="flex items-center gap-2 rounded-2xl bg-critical px-4 py-2.5 font-bold text-ivory-50">
            <OctagonAlert aria-hidden="true" className="size-5 shrink-0" />
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={busy}
        className="group mt-1 flex min-h-14 items-center justify-between gap-3 rounded-full bg-sand-300 pl-6 pr-1.5 text-lg font-bold text-navy-950 transition disabled:opacity-60"
      >
        {submitLabel}
        <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-navy-900 text-ivory-50 transition group-hover:translate-x-0.5">
          <ArrowRight className="size-5" />
        </span>
      </button>
    </form>
  );
}

"use client";

import { LogIn } from "lucide-react";
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
}

export function LoginForm({ endpoint, fields, submitLabel, messages }: Props) {
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
        router.replace(data.redirect);
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
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate={false}>
      {fields.map((f) => (
        <label key={f.name} className="flex flex-col gap-2 text-lg font-semibold">
          {f.label}
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
            className="min-h-14 rounded-xl border-2 border-line bg-surface px-4 text-2xl tracking-wider text-ink"
          />
        </label>
      ))}
      <p id="login-error" role="alert" aria-live="polite" className="min-h-6 font-semibold text-danger">
        {error}
      </p>
      <button
        type="submit"
        disabled={busy}
        className="flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-brand px-6 text-xl font-bold text-brand-ink disabled:opacity-60"
      >
        <LogIn aria-hidden="true" className="size-7" />
        {submitLabel}
      </button>
    </form>
  );
}

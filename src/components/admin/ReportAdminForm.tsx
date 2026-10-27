"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

interface Props {
  reportId: string;
  status: string;
  severity: number;
  category: string;
  categories: { id: string; label: string }[];
}

const STATUSES = [
  ["received", "Received"],
  ["in_review", "In review"],
  ["action_taken", "Action taken"],
  ["resolved", "Resolved"],
] as const;
const SEVERITIES = [
  [1, "1 · Low"],
  [2, "2 · Moderate"],
  [3, "3 · Serious"],
  [4, "4 · Critical"],
] as const;

export function ReportAdminForm({ reportId, status, severity, category, categories }: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: f.get("status"),
        note: f.get("note"),
        severity: Number(f.get("severity")),
        category: f.get("category"),
      }),
    }).catch(() => null);
    setBusy(false);
    setMsg(res?.ok ? "Saved. The worker's tracking page now shows this update." : "Could not save. Try again.");
    if (res?.ok) {
      e.currentTarget?.reset();
      router.refresh();
    }
  }

  const field = "min-h-11 rounded-full border border-ink-900/20 bg-cream-50 px-4 text-ink";
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 font-semibold">
          Status
          <select name="status" defaultValue={status} className={field}>
            {STATUSES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-semibold">
          Severity (override)
          <select name="severity" defaultValue={severity} className={field}>
            {SEVERITIES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-semibold">
          Category (override)
          <select name="category" defaultValue={category} className={field}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1 font-semibold">
        Note for the worker (shown on their tracking page)
        <textarea name="note" rows={2} maxLength={500} className="rounded-3xl border border-ink-900/20 bg-cream-50 p-4 text-ink" />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className="flex min-h-11 items-center gap-2 rounded-full bg-forest-900 px-5 font-bold text-cream-50 disabled:opacity-60">
          <Save aria-hidden="true" className="size-5" />
          Save update
        </button>
        <p role="status" aria-live="polite" className="text-sm font-semibold">
          {msg}
        </p>
      </div>
    </form>
  );
}

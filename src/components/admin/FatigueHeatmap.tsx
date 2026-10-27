"use client";

import { CircleCheck, OctagonAlert, TriangleAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FatigueLevel } from "@/lib/rules/fatigue";

export interface HeatCell {
  date: string;
  hours: number;
  level: FatigueLevel;
  reasons: string[];
  actions: string[];
}

export interface HeatRow {
  workerId: string;
  name: string;
  role: string;
  cells: HeatCell[];
}

const CELL: Record<FatigueLevel, string> = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn ring-1 ring-inset ring-warn",
  critical: "bg-danger text-danger-ink",
};
const LEVEL_LABEL: Record<FatigueLevel, string> = { ok: "OK", warn: "Warning", critical: "Critical" };
const ACTIONS = [
  ["rest_given", "Rest day given"],
  ["shift_swapped", "Shift swapped"],
  ["hours_reduced", "Hours reduced"],
  ["talked", "Talked with worker"],
] as const;
const ACTION_LABEL: Record<string, string> = Object.fromEntries(ACTIONS);

export function FatigueHeatmap({ rows, dates }: { rows: HeatRow[]; dates: { key: string; label: string }[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<{ row: HeatRow; cell: HeatCell } | null>(null);
  const [status, setStatus] = useState("");

  async function logAction(action: string) {
    if (!sel) return;
    setStatus("Saving…");
    const res = await fetch("/api/admin/fatigue/action", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workerId: sel.row.workerId, date: sel.cell.date, action }),
    }).catch(() => null);
    if (res?.ok) {
      setSel({ ...sel, cell: { ...sel.cell, actions: [...sel.cell.actions, action] } });
      setStatus(`Logged: ${ACTION_LABEL[action]}`);
      router.refresh();
    } else setStatus("Could not save.");
  }

  return (
    <div className="flex flex-col gap-4 xl:flex-row">
      <div className="min-w-0 flex-1 overflow-x-auto rounded-2xl bg-surface p-3 shadow-sm">
        <table className="border-separate border-spacing-0.5 text-xs">
          <caption className="sr-only">Fatigue level per worker per day. Select a cell for reasons and to log an action.</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 bg-surface p-1 text-left text-sm">
                Worker
              </th>
              {dates.map((d) => (
                <th key={d.key} scope="col" className="w-10 p-1 font-semibold text-muted">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.workerId}>
                <th scope="row" className="sticky left-0 whitespace-nowrap bg-surface p-1 pr-3 text-left text-sm font-semibold">
                  {row.name}
                  <span className="block text-xs font-normal text-muted">{row.role}</span>
                </th>
                {row.cells.map((c) => {
                  const off = c.hours === 0;
                  const selected = sel?.row.workerId === row.workerId && sel.cell.date === c.date;
                  return (
                    <td key={c.date} className="p-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSel({ row, cell: c });
                          setStatus("");
                        }}
                        aria-label={`${row.name}, ${c.date}: ${off ? "Day off" : `${LEVEL_LABEL[c.level]}, ${c.hours} hours`}${c.actions.length ? ", action logged" : ""}`}
                        aria-pressed={selected}
                        className={`relative flex size-10 items-center justify-center rounded-md font-semibold ${
                          off ? "bg-surface-2 text-muted" : CELL[c.level]
                        } ${selected ? "outline outline-3 outline-[var(--focus)]" : ""}`}
                      >
                        {off ? "–" : c.level === "ok" ? Math.round(c.hours) : c.level === "warn" ? <TriangleAlert aria-hidden="true" className="size-4" /> : <OctagonAlert aria-hidden="true" className="size-4" />}
                        {c.actions.length > 0 && <span aria-hidden="true" className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-info" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <aside aria-live="polite" className="rounded-2xl bg-surface p-4 shadow-sm xl:w-80 xl:shrink-0">
        {!sel ? (
          <p className="text-muted">Select a cell to see why it was flagged and to log what you did about it.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-bold">
                {sel.row.name} · {sel.cell.date}
              </h2>
              <button type="button" aria-label="Close details" onClick={() => setSel(null)} className="flex size-9 items-center justify-center rounded-lg hover:bg-surface-2">
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <p className="font-semibold">
              {sel.cell.hours === 0 ? "Day off" : `${sel.cell.hours}h worked · ${LEVEL_LABEL[sel.cell.level]}`}
            </p>
            {sel.cell.reasons.length > 0 ? (
              <ul className="list-disc pl-5">
                {sel.cell.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-1 text-ok">
                <CircleCheck aria-hidden="true" className="size-4" /> No fatigue rule broken.
              </p>
            )}
            {sel.cell.actions.length > 0 && (
              <p className="text-sm">Logged: {sel.cell.actions.map((a) => ACTION_LABEL[a] ?? a).join(", ")}</p>
            )}
            {sel.cell.level !== "ok" && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 font-semibold">Log action</legend>
                {ACTIONS.map(([v, l]) => (
                  <button key={v} type="button" onClick={() => void logAction(v)} className="min-h-11 rounded-lg border-2 border-line px-3 text-left font-semibold hover:bg-surface-2">
                    {l}
                  </button>
                ))}
              </fieldset>
            )}
            <p className="text-sm font-semibold">{status}</p>
          </div>
        )}
      </aside>
    </div>
  );
}

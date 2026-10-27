"use client";

import { CircleCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DotCalendar, type DotState } from "@/components/ui/DotCalendar";
import { StatusPill } from "@/components/ui/StatusPill";
import type { FatigueLevel } from "@/lib/rules/fatigue";
import { panel } from "@/components/admin/styles";

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

const LEVEL_LABEL: Record<FatigueLevel, string> = { ok: "OK", warn: "Warning", critical: "Critical" };
const ACTIONS = [
  ["rest_given", "Rest day given"],
  ["shift_swapped", "Shift swapped"],
  ["hours_reduced", "Hours reduced"],
  ["talked", "Talked with worker"],
] as const;
const ACTION_LABEL: Record<string, string> = Object.fromEntries(ACTIONS);

const stateOf = (c: HeatCell): DotState => (c.hours === 0 ? "off" : c.level);

/** Workers × days fatigue grid in the shared dot style, with a side panel to read reasons and log action. */
export function FatigueHeatmap({ rows, dates }: { rows: HeatRow[]; dates: { key: string; label: string }[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<{ row: string; dot: string } | null>(null);
  const [logged, setLogged] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState("");

  const selected = useMemo(() => {
    if (!sel) return null;
    const row = rows.find((r) => r.workerId === sel.row);
    const cell = row?.cells.find((c) => c.date === sel.dot);
    return row && cell ? { row, cell } : null;
  }, [rows, sel]);
  const actionsFor = (row: HeatRow, cell: HeatCell) => [...cell.actions, ...(logged[`${row.workerId}|${cell.date}`] ?? [])];

  async function logAction(action: string) {
    if (!selected) return;
    setStatus("Saving…");
    const res = await fetch("/api/admin/fatigue/action", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workerId: selected.row.workerId, date: selected.cell.date, action }),
    }).catch(() => null);
    if (res?.ok) {
      const k = `${selected.row.workerId}|${selected.cell.date}`;
      setLogged((l) => ({ ...l, [k]: [...(l[k] ?? []), action] }));
      setStatus(`Logged: ${ACTION_LABEL[action]}`);
      router.refresh();
    } else setStatus("Could not save.");
  }

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
      <div className={`min-w-0 flex-1 overflow-x-auto ${panel} p-4`}>
        <DotCalendar
          tone="light"
          caption="Fatigue level per worker per day. Select a dot for reasons and to log an action."
          columns={dates.map((d) => d.label)}
          selected={sel}
          onSelect={(row, dot) => {
            setSel({ row, dot });
            setStatus("");
          }}
          rows={rows.map((r) => ({
            key: r.workerId,
            label: r.name,
            sublabel: r.role,
            dots: r.cells.map((c) => ({
              key: c.date,
              state: stateOf(c),
              label: `${r.name}, ${c.date}: ${c.hours === 0 ? "day off" : `${LEVEL_LABEL[c.level]}, ${c.hours} hours`}${actionsFor(r, c).length ? ", action logged" : ""}`,
            })),
          }))}
        />
      </div>

      <aside aria-label="Day details" aria-live="polite" className="glass-light rounded-3xl p-5 xl:sticky xl:top-24 xl:w-80 xl:shrink-0">
        {!selected ? (
          <p className="text-navy-950/70">Select a dot to see why the day was flagged and to log what you did about it.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-navy-950">{selected.row.name}</h2>
                <p className="text-sm text-navy-950/70">{selected.cell.date}</p>
              </div>
              <button type="button" aria-label="Close details" onClick={() => setSel(null)} className="flex size-10 items-center justify-center rounded-full hover:bg-navy-950/5">
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            {selected.cell.hours === 0 ? (
              <StatusPill tone="neutral" label="Day off" />
            ) : (
              <p className="flex items-center gap-2 font-semibold text-navy-950">
                <StatusPill tone={selected.cell.level} label={LEVEL_LABEL[selected.cell.level]} />
                {selected.cell.hours}h worked
              </p>
            )}
            {selected.cell.reasons.length > 0 ? (
              <ul className="list-disc pl-5 text-navy-950">
                {selected.cell.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-1.5 text-slate-600">
                <CircleCheck aria-hidden="true" className="size-4" /> No fatigue rule broken.
              </p>
            )}
            {actionsFor(selected.row, selected.cell).length > 0 && (
              <p className="text-sm text-navy-950">Logged: {actionsFor(selected.row, selected.cell).map((a) => ACTION_LABEL[a] ?? a).join(", ")}</p>
            )}
            {selected.cell.level !== "ok" && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-bold uppercase tracking-wider text-navy-950/70">Log action</legend>
                {ACTIONS.map(([v, l]) => (
                  <button key={v} type="button" onClick={() => void logAction(v)} className="min-h-11 rounded-full border border-navy-950/20 bg-ivory-50 px-4 text-left font-semibold text-navy-950 hover:border-slate-600">
                    {l}
                  </button>
                ))}
              </fieldset>
            )}
            <p className="text-sm font-semibold text-navy-950">{status}</p>
          </div>
        )}
      </aside>
    </div>
  );
}

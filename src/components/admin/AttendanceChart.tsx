"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface AttendancePoint {
  label: string;
  rate: number;
  present: number;
}

/** 14-day attendance line. Loaded lazily; a data table alternative is rendered next to it. */
export default function AttendanceChart({ data }: { data: AttendancePoint[] }) {
  return (
    <div className="h-56 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 24, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" strokeWidth={1} />
          <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "var(--grid)" }} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fill: "var(--muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ stroke: "var(--muted)", strokeWidth: 1 }}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--ink)" }}
            labelStyle={{ color: "var(--ink)", fontWeight: 700 }}
            formatter={(v, _n, item) => [`${String(v)}% (${(item.payload as AttendancePoint).present} people)`, "Attendance"]}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="var(--chart)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={{ r: 4, fill: "var(--chart)", stroke: "var(--surface)", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "var(--chart)", stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

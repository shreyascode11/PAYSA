"use client";

import dynamic from "next/dynamic";

// recharts stays out of every bundle except this admin chart's own chunk.
export const AttendanceChartLazy = dynamic(() => import("./AttendanceChart"), {
  ssr: false,
  loading: () => <div className="h-56 w-full animate-pulse rounded-xl bg-surface-2" />,
});

"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="no-print flex min-h-11 items-center gap-2 rounded-full bg-navy-950 px-5 font-bold text-ivory-50">
      <Printer aria-hidden="true" className="size-5" /> Print QR posters
    </button>
  );
}

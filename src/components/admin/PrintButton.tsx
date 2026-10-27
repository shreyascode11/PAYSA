"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="no-print flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 font-bold text-brand-ink">
      <Printer aria-hidden="true" className="size-5" /> Print QR posters
    </button>
  );
}

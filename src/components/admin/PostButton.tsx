"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

/** Small one-shot JSON POST action (endorse a skill, etc.) that refreshes the page on success. */
export function PostButton({ endpoint, body, children, doneLabel }: { endpoint: string; body: object; children: ReactNode; doneLabel: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  async function go() {
    setState("busy");
    const res = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    setState(res?.ok ? "done" : "error");
    if (res?.ok) router.refresh();
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={() => void go()} disabled={state === "busy" || state === "done"} className="min-h-10 rounded-full border border-forest-700 px-4 text-sm font-bold text-forest-700 disabled:opacity-60">
        {state === "done" ? doneLabel : children}
      </button>
      {state === "error" && <span role="alert" className="text-sm text-danger">Failed</span>}
    </span>
  );
}

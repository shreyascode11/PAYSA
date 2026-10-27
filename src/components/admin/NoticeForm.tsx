"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function NoticeForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orgId, text: f.get("text"), lang: f.get("lang") }),
    }).catch(() => null);
    setMsg(res?.ok ? "Posted. Workers see it on their home screen and can listen to it." : "Could not post.");
    if (res?.ok) {
      form.reset();
      router.refresh();
    }
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-3xl border border-ink-900/10 bg-cream-50 p-5 shadow-sm shadow-ink-900/5">
      <label className="flex flex-col gap-1 font-semibold">
        Notice (max 280 characters, keep it short)
        <textarea name="text" required maxLength={280} rows={3} className="rounded-3xl border border-ink-900/20 bg-cream-50 p-4 text-ink" />
      </label>
      <label className="flex flex-col gap-1 font-semibold">
        Written in (used for the read-aloud voice)
        <select name="lang" defaultValue="en" className="min-h-11 max-w-xs rounded-full border border-ink-900/20 bg-cream-50 px-4 text-ink">
          <option value="en">English</option>
          <option value="ta">Tamil</option>
          <option value="hi">Hindi</option>
        </select>
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" className="flex min-h-11 items-center gap-2 rounded-full bg-forest-900 px-5 font-bold text-cream-50">
          <Send aria-hidden="true" className="size-5" /> Post notice
        </button>
        <p role="status" className="text-sm font-semibold">
          {msg}
        </p>
      </div>
    </form>
  );
}

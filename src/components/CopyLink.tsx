"use client";

import { Copy, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

export function CopyLink({ url, copyLabel, copiedLabel, shareLabel }: { url: string; copyLabel: string; copiedLabel: string; shareLabel: string }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  // Decided after mount so server and client render the same markup.
  useEffect(() => setCanShare("share" in navigator), []);
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => void navigator.clipboard?.writeText(url).then(() => setCopied(true))}
        className="flex min-h-12 items-center gap-2 rounded-xl border-2 border-line bg-surface px-4 font-bold"
      >
        <Copy aria-hidden="true" className="size-5" />
        {copied ? copiedLabel : copyLabel}
      </button>
      {canShare && (
        <button
          type="button"
          onClick={() => void navigator.share({ url }).catch(() => undefined)}
          className="flex min-h-12 items-center gap-2 rounded-xl bg-brand px-4 font-bold text-brand-ink"
        >
          <Share2 aria-hidden="true" className="size-5" />
          {shareLabel}
        </button>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

interface Props {
  onScan: (text: string) => void;
  onError: (reason: "camera_denied") => void;
  hint: string;
}

/** Camera QR scanner inside an orange-bracket frame. Loaded on demand so html5-qrcode never weighs down first load. */
export default function QrScanner({ onScan, onError, hint }: Props) {
  const done = useRef(false);

  useEffect(() => {
    let scanner: { stop: () => Promise<void>; isScanning: boolean } | null = null;
    let cancelled = false;
    void import("html5-qrcode").then(async ({ Html5Qrcode }) => {
      if (cancelled) return;
      const s = new Html5Qrcode("qr-region", { verbose: false });
      scanner = s;
      try {
        await s.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 220 },
          (text) => {
            if (done.current) return;
            done.current = true;
            onScan(text);
          },
          () => undefined,
        );
      } catch {
        onError("camera_denied");
      }
    });
    return () => {
      cancelled = true;
      if (scanner?.isScanning) void scanner.stop().catch(() => undefined);
    };
  }, [onScan, onError]);

  const corner = "absolute size-12 border-safety-500";
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-4xl bg-ink-900">
        <div id="qr-region" className="size-full [&_video]:size-full [&_video]:object-cover" />
        <span aria-hidden="true" className={`${corner} left-5 top-5 rounded-tl-2xl border-l-[5px] border-t-[5px]`} />
        <span aria-hidden="true" className={`${corner} right-5 top-5 rounded-tr-2xl border-r-[5px] border-t-[5px]`} />
        <span aria-hidden="true" className={`${corner} bottom-5 left-5 rounded-bl-2xl border-b-[5px] border-l-[5px]`} />
        <span aria-hidden="true" className={`${corner} bottom-5 right-5 rounded-br-2xl border-b-[5px] border-r-[5px]`} />
        <span aria-hidden="true" className="scan-line absolute inset-x-8 h-1 rounded-full bg-safety-500 shadow-[0_0_16px_4px] shadow-safety-500/60" />
      </div>
      <p className="text-center font-semibold text-cream-50/80">{hint}</p>
    </div>
  );
}

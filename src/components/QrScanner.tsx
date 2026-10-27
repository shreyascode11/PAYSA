"use client";

import { useEffect, useRef } from "react";

interface Props {
  onScan: (text: string) => void;
  onError: (reason: "camera_denied") => void;
  hint: string;
}

/** Camera QR scanner. Loaded on demand so html5-qrcode never weighs down the first page load. */
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
          { fps: 10, qrbox: 240 },
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

  return (
    <div>
      <p className="mb-2 font-semibold">{hint}</p>
      <div id="qr-region" className="overflow-hidden rounded-2xl bg-surface-2" />
    </div>
  );
}

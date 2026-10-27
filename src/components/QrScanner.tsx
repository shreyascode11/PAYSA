"use client";

import { Camera } from "lucide-react";
import { useEffect, useRef } from "react";

export type ScanError = "camera_denied" | "photo_failed";

interface Props {
  onScan: (text: string) => void;
  onError: (reason: ScanError) => void;
  hint: string;
  photoLabel: string;
}

/** Share of the square viewfinder that is actually decoded; the corner brackets are drawn on this box. */
const SCAN_BOX = 0.85;
const INSET = `${((1 - SCAN_BOX) / 2) * 100}%`;

type ScannerModule = typeof import("html5-qrcode");

/** QR-only decoder that prefers the phone's native BarcodeDetector (much faster than the JS fallback). */
function createDecoder(m: ScannerModule, elementId: string) {
  return new m.Html5Qrcode(elementId, {
    verbose: false,
    formatsToSupport: [m.Html5QrcodeSupportedFormats.QR_CODE],
    experimentalFeatures: { useBarCodeDetectorIfSupported: true },
  });
}

/**
 * Live camera scanner with a photo fallback. Loaded on demand so html5-qrcode never weighs down
 * first load. The stream is requested square so the visible frame and the decoded area match on
 * portrait phone cameras.
 */
export default function QrScanner({ onScan, onError, hint, photoLabel }: Props) {
  const done = useRef(false);
  const mod = useRef<Promise<ScannerModule> | null>(null);
  const load = () => (mod.current ??= import("html5-qrcode"));

  const deliver = (text: string) => {
    if (done.current) return;
    done.current = true;
    onScan(text);
  };

  useEffect(() => {
    let scanner: { stop: () => Promise<void>; isScanning: boolean } | null = null;
    let cancelled = false;
    void load().then(async (m) => {
      if (cancelled) return;
      const s = createDecoder(m, "qr-region");
      scanner = s;
      try {
        await s.start(
          { facingMode: "environment" },
          {
            fps: 15,
            aspectRatio: 1,
            qrbox: (w, h) => {
              const size = Math.max(160, Math.floor(Math.min(w, h) * SCAN_BOX));
              return { width: size, height: size };
            },
          },
          deliver,
          () => undefined,
        );
      } catch {
        if (!cancelled) onError("camera_denied");
      }
    });
    return () => {
      cancelled = true;
      if (scanner?.isScanning) void scanner.stop().catch(() => undefined);
    };
    // Start the camera once per mount; callbacks are read through stable refs/closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function scanPhoto(file: File | undefined) {
    if (!file) return;
    try {
      const m = await load();
      deliver(await createDecoder(m, "qr-file-region").scanFile(file, false));
    } catch {
      onError("photo_failed");
    }
  }

  const corner = "absolute size-12 border-sand-300";
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-4xl bg-navy-950">
        {/* html5-qrcode draws its own shaded box; ours (below) replaces it. */}
        <div id="qr-region" className="size-full [&_#qr-shaded-region]:hidden [&_video]:!w-full" />
        <span aria-hidden="true" className={`${corner} rounded-tl-2xl border-l-[5px] border-t-[5px]`} style={{ left: INSET, top: INSET }} />
        <span aria-hidden="true" className={`${corner} rounded-tr-2xl border-r-[5px] border-t-[5px]`} style={{ right: INSET, top: INSET }} />
        <span aria-hidden="true" className={`${corner} rounded-bl-2xl border-b-[5px] border-l-[5px]`} style={{ left: INSET, bottom: INSET }} />
        <span aria-hidden="true" className={`${corner} rounded-br-2xl border-b-[5px] border-r-[5px]`} style={{ right: INSET, bottom: INSET }} />
        <span aria-hidden="true" className="scan-line absolute h-1 rounded-full bg-sand-300 shadow-[0_0_16px_4px] shadow-sand-300/60" style={{ left: INSET, right: INSET }} />
      </div>
      <p className="text-center font-semibold text-ivory-50/80">{hint}</p>
      <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-full border-2 border-ivory-50/45 px-5 font-semibold focus-within:outline focus-within:outline-3 focus-within:outline-[var(--focus)]">
        <Camera aria-hidden="true" className="size-5" />
        {photoLabel}
        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => void scanPhoto(e.target.files?.[0])} />
      </label>
      <div id="qr-file-region" hidden />
    </div>
  );
}

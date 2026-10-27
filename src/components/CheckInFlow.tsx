"use client";

import { CircleCheck, CircleStop, MapPin, QrCode, TriangleAlert } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BigButton } from "./BigButton";

const QrScanner = dynamic(() => import("./QrScanner"), { ssr: false });

export interface CheckInLabels {
  choose: string;
  scanQr: string;
  useGps: string;
  scanning: string;
  locating: string;
  endWork: string;
  confirmOut: string;
  successIn: string;
  successOut: string;
  goHome: string;
  generic: string;
  offline: string;
  errors: Record<string, string>;
}

interface Props {
  mode: "in" | "out";
  initialQr?: { siteId: string; token: string };
  labels: CheckInLabels;
  locale: string;
}

type Result = { kind: "ok" | "error"; text: string } | null;

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function parseQr(text: string): { siteId: string; token: string } | null {
  try {
    const u = new URL(text);
    const siteId = u.searchParams.get("site");
    const token = u.searchParams.get("t");
    return siteId && token ? { siteId, token } : null;
  } catch {
    return null;
  }
}

export function CheckInFlow({ mode, initialQr, labels, locale }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"choose" | "scan" | "locating" | "busy">("choose");
  const [result, setResult] = useState<Result>(null);
  const autoRan = useRef(false);

  const errorText = useCallback(
    (code: string, extra: Record<string, string | number> = {}) => fill(labels.errors[code] ?? labels.generic, extra),
    [labels],
  );

  const send = useCallback(
    async (url: string, body: object) => {
      setStep("busy");
      try {
        const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
        const data = (await res.json()) as { error?: string; checkIn?: string; hours?: number; distance?: number; site?: string };
        if (!res.ok) {
          setResult({ kind: "error", text: errorText(data.error ?? "", { distance: data.distance ?? 0, site: data.site ?? "" }) });
          setStep("choose");
          return;
        }
        const text =
          mode === "in"
            ? fill(labels.successIn, {
                time: new Date(data.checkIn ?? Date.now()).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" }),
              })
            : fill(labels.successOut, { hours: Math.round((data.hours ?? 0) * 10) / 10 });
        setResult({ kind: "ok", text });
        router.refresh();
      } catch {
        setResult({ kind: "error", text: navigator.onLine ? labels.generic : labels.offline });
        setStep("choose");
      }
    },
    [errorText, labels, locale, mode, router],
  );

  const onScan = useCallback(
    (text: string) => {
      const qr = parseQr(text);
      if (!qr) {
        setResult({ kind: "error", text: errorText("bad_qr") });
        setStep("choose");
        return;
      }
      void send("/api/shifts/check-in", { method: "qr", siteId: qr.siteId, qrToken: qr.token });
    },
    [errorText, send],
  );

  const onScanError = useCallback(
    (reason: string) => {
      setResult({ kind: "error", text: errorText(reason) });
      setStep("choose");
    },
    [errorText],
  );

  // Scanning the poster with the phone's own camera app opens this page with the token in the URL.
  useEffect(() => {
    if (mode === "in" && initialQr && !autoRan.current) {
      autoRan.current = true;
      void send("/api/shifts/check-in", { method: "qr", siteId: initialQr.siteId, qrToken: initialQr.token });
    }
  }, [initialQr, mode, send]);

  function useGps() {
    if (!("geolocation" in navigator)) {
      setResult({ kind: "error", text: errorText("gps_unavailable") });
      return;
    }
    setResult(null);
    setStep("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => void send("/api/shifts/check-in", { method: "geo", lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        setResult({ kind: "error", text: errorText(err.code === err.PERMISSION_DENIED ? "gps_denied" : "gps_unavailable") });
        setStep("choose");
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    );
  }

  const done = result?.kind === "ok";

  return (
    <div className="flex flex-col gap-4">
      <div aria-live="polite" role="status">
        {result && (
          <p
            className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-xl font-semibold ${
              result.kind === "ok" ? "border-ok bg-ok-soft text-ok" : "border-danger bg-danger-soft text-danger"
            }`}
          >
            {result.kind === "ok" ? (
              <CircleCheck aria-hidden="true" className="size-8 shrink-0" />
            ) : (
              <TriangleAlert aria-hidden="true" className="size-8 shrink-0" />
            )}
            <span>{result.text}</span>
          </p>
        )}
        {step === "locating" && <p className="text-lg font-semibold">{labels.locating}</p>}
      </div>

      {done ? (
        <Link href="/w/home" className="flex min-h-16 items-center justify-center rounded-2xl bg-brand text-xl font-bold text-brand-ink">
          {labels.goHome}
        </Link>
      ) : mode === "out" ? (
        <>
          <p>{labels.confirmOut}</p>
          <BigButton tone="danger" icon={<CircleStop />} label={labels.endWork} disabled={step === "busy"} onClick={() => void send("/api/shifts/check-out", {})} />
        </>
      ) : step === "scan" ? (
        <QrScanner onScan={onScan} onError={onScanError} hint={labels.scanning} />
      ) : (
        <>
          <p className="font-semibold">{labels.choose}</p>
          <BigButton icon={<QrCode />} label={labels.scanQr} disabled={step !== "choose"} onClick={() => { setResult(null); setStep("scan"); }} />
          <BigButton tone="neutral" icon={<MapPin />} label={labels.useGps} disabled={step !== "choose"} onClick={useGps} />
        </>
      )}
    </div>
  );
}

"use client";

import { CircleCheck, CircleStop, MapPin, OctagonAlert, QrCode, ScanLine } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BigButton } from "./ui/BigButton";

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
  stepReady: string;
  stepScan: string;
  stepDone: string;
  stepOf: string;
  permission: string;
  tryAgain: string;
  cancel: string;
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
  const failed = result?.kind === "error";
  const stepIndex = done || failed ? 2 : step === "scan" || step === "busy" || step === "locating" ? 1 : 0;
  const steps = [labels.stepReady, labels.stepScan, labels.stepDone];

  return (
    <div className="flex flex-col gap-6">
      <ol aria-label={fill(labels.stepOf, { n: stepIndex + 1 })} className="grid grid-cols-3 gap-2">
        {steps.map((name, i) => (
          <li key={name} aria-current={i === stepIndex ? "step" : undefined} className="flex flex-col gap-1.5">
            <span aria-hidden="true" className={`h-1.5 rounded-full ${i <= stepIndex ? "bg-safety-500" : "bg-cream-50/20"}`} />
            <span className={`text-sm ${i === stepIndex ? "font-extrabold text-cream-50" : "font-semibold text-cream-50/75"}`}>
              {i + 1}. {name}
            </span>
          </li>
        ))}
      </ol>

      <div aria-live="polite" role="status" className="contents">
        {result && (
          <section className="flex flex-col items-center gap-4 rounded-4xl bg-mint-100/8 px-6 py-8 text-center">
            <span className={`flex size-24 items-center justify-center rounded-full ${result.kind === "ok" ? "bg-ok text-ink-900" : "bg-critical text-cream-50"}`}>
              {result.kind === "ok" ? <CircleCheck aria-hidden="true" className="size-12" /> : <OctagonAlert aria-hidden="true" className="size-12" />}
            </span>
            <p className="text-xl font-bold">{result.text}</p>
          </section>
        )}
        {step === "locating" && (
          <p className="flex items-center justify-center gap-2 rounded-full bg-mint-100/8 py-3 font-semibold">
            <MapPin aria-hidden="true" className="size-5 animate-pulse" />
            {labels.locating}
          </p>
        )}
      </div>

      {done ? (
        <Link href="/w/home" className="flex min-h-16 items-center justify-center rounded-full bg-safety-500 text-xl font-extrabold text-ink-900">
          {labels.goHome}
        </Link>
      ) : mode === "out" ? (
        <>
          {!failed && <p className="text-center text-cream-50/80">{labels.confirmOut}</p>}
          <BigButton icon={<CircleStop />} label={failed ? labels.tryAgain : labels.endWork} disabled={step === "busy"} onClick={() => void send("/api/shifts/check-out", {})} />
        </>
      ) : step === "scan" ? (
        <>
          <QrScanner onScan={onScan} onError={onScanError} hint={labels.scanning} />
          <button type="button" onClick={() => setStep("choose")} className="min-h-12 rounded-full font-bold text-cream-50 underline">
            {labels.cancel}
          </button>
        </>
      ) : (
        <>
          {!failed && (
            <section className="flex flex-col items-center gap-4 py-2 text-center">
              <span aria-hidden="true" className="relative flex size-40 items-center justify-center rounded-[40%] bg-cream-50/90 text-ink-900">
                <ScanLine className="size-20" strokeWidth={1.75} />
                <span className="absolute -right-1 top-3 size-6 rounded-full bg-safety-500" />
              </span>
              <p className="text-xl font-bold">{labels.choose}</p>
              <p className="max-w-xs text-base text-cream-50/75">{labels.permission}</p>
            </section>
          )}
          <BigButton
            icon={<QrCode />}
            label={failed ? labels.tryAgain : labels.scanQr}
            disabled={step !== "choose"}
            onClick={() => {
              setResult(null);
              setStep("scan");
            }}
          />
          <BigButton variant="outline" icon={<MapPin />} label={labels.useGps} disabled={step !== "choose"} onClick={useGps} />
        </>
      )}
    </div>
  );
}

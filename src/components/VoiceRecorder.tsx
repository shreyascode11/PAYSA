"use client";

import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Lang } from "@/lib/types";

const MAX_SECONDS = 60;
const MAX_BYTES = 2 * 1024 * 1024;
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];

export interface Transcript {
  text: string;
  textEn: string;
  lang: Lang;
}

export type RecorderError = "micDenied" | "aiUnavailable" | "tooLong" | "generic";

interface Props {
  lang: Lang;
  labels: { hold: string; recording: string; transcribing: string };
  onTranscript: (t: Transcript) => void;
  onError: (e: RecorderError) => void;
}

/** Hold-to-talk (touch/mouse) or press-to-toggle (keyboard). Audio is sent once for transcription and never stored. */
export default function VoiceRecorder({ lang, labels, onTranscript, onError }: Props) {
  const [state, setState] = useState<"idle" | "recording" | "sending">("idle");
  const [seconds, setSeconds] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  // Whether the user still wants to record once the (possibly slow) mic permission resolves.
  const wanted = useRef(false);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      rec.current?.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  async function upload(blob: Blob) {
    if (blob.size > MAX_BYTES) return onError("tooLong");
    setState("sending");
    const form = new FormData();
    form.set("audio", blob, "note");
    form.set("lang", lang);
    try {
      const res = await fetch("/api/voice/transcribe", { method: "POST", body: form });
      if (res.ok) onTranscript((await res.json()) as Transcript);
      else onError(res.status === 503 ? "aiUnavailable" : res.status === 413 ? "tooLong" : "generic");
    } catch {
      onError("generic");
    }
    setState("idle");
  }

  async function start() {
    if (state !== "idle") return;
    wanted.current = true;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return onError("micDenied");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return onError("micDenied");
    }
    // Released during the first-use permission prompt: don't start a recording nobody is holding.
    if (!wanted.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    const mimeType = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m));
    const r = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 24_000 } : undefined);
    chunks.current = [];
    r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    r.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      if (timer.current) clearInterval(timer.current);
      void upload(new Blob(chunks.current, { type: (r.mimeType || "audio/webm").split(";")[0] }));
    };
    rec.current = r;
    r.start();
    setSeconds(0);
    setState("recording");
    const startedAt = Date.now();
    timer.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setSeconds(elapsed);
      if (elapsed >= MAX_SECONDS) stop();
    }, 1000);
  }

  function stop() {
    wanted.current = false;
    if (rec.current?.state === "recording") rec.current.stop();
  }

  function onKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    if (state === "recording") stop();
    else void start();
  }

  const recording = state === "recording";
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        aria-pressed={recording}
        aria-label={recording ? labels.recording : labels.hold}
        disabled={state === "sending"}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          void start();
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onKeyDown={onKey}
        onContextMenu={(e) => e.preventDefault()}
        className={`flex size-28 touch-none select-none items-center justify-center rounded-full shadow-lg ${
          recording ? "animate-pulse bg-danger text-danger-ink" : "bg-brand text-brand-ink"
        } disabled:opacity-60`}
      >
        {recording ? <Square aria-hidden="true" className="size-12" /> : <Mic aria-hidden="true" className="size-14" />}
      </button>
      <p aria-live="polite" className="text-center font-semibold">
        {recording ? `${labels.recording} ${seconds}s / ${MAX_SECONDS}s` : state === "sending" ? labels.transcribing : labels.hold}
      </p>
    </div>
  );
}

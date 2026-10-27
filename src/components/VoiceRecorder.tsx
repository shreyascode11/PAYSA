"use client";

import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { LANG_TAGS } from "@/lib/lang";
import type { Lang } from "@/lib/types";

const MAX_SECONDS = 60;
const MAX_BYTES = 2 * 1024 * 1024;
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];

export interface Transcript {
  text: string;
  /** Present when Gemini translated the note; the server translates otherwise. */
  textEn?: string;
  lang: Lang;
}

export type RecorderError = "micDenied" | "aiUnavailable" | "tooLong" | "noSpeech" | "generic";

interface Props {
  lang: Lang;
  /** True when the server can transcribe with Gemini; otherwise the browser's own recogniser is used. */
  aiVoice: boolean;
  labels: { hold: string; recording: string; transcribing: string };
  onTranscript: (t: Transcript) => void;
  onError: (e: RecorderError) => void;
}

// Minimal typing for the Web Speech API (not yet in TypeScript's DOM lib).
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function createRecognition(): Recognition | null {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

/**
 * Hold-to-talk (touch/mouse) or press-to-toggle (keyboard), in the worker's language.
 * With Gemini: audio is recorded and sent once for transcription + translation, never stored.
 * Without it: the browser's built-in speech recogniser (ta-IN / hi-IN / en-IN) transcribes live.
 */
export default function VoiceRecorder({ lang, aiVoice, labels, onTranscript, onError }: Props) {
  const [state, setState] = useState<"idle" | "recording" | "sending">("idle");
  const [seconds, setSeconds] = useState(0);
  const [live, setLive] = useState("");
  const rec = useRef<MediaRecorder | null>(null);
  const recog = useRef<Recognition | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  // Whether the user still wants to record once the (possibly slow) mic permission resolves.
  const wanted = useRef(false);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      rec.current?.stream.getTracks().forEach((t) => t.stop());
      recog.current?.stop();
    },
    [],
  );

  function startTimer() {
    const startedAt = Date.now();
    setSeconds(0);
    timer.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setSeconds(elapsed);
      if (elapsed >= MAX_SECONDS) stop();
    }, 1000);
  }

  function stopTimer() {
    if (timer.current) clearInterval(timer.current);
  }

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

  function startBrowserRecognition(): boolean {
    const r = createRecognition();
    if (!r) return false;
    let finalText = "";
    r.lang = LANG_TAGS[lang];
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (!res) continue;
        if (res.isFinal) finalText += `${res[0].transcript} `;
        else interim += res[0].transcript;
      }
      setLive(`${finalText}${interim}`.trim());
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") onError("micDenied");
      else if (e.error === "no-speech") onError("noSpeech");
      else if (e.error !== "aborted") onError("generic");
    };
    r.onend = () => {
      stopTimer();
      setState("idle");
      setLive("");
      const text = finalText.trim();
      if (text) onTranscript({ text, lang });
    };
    recog.current = r;
    r.start();
    setLive("");
    setState("recording");
    startTimer();
    return true;
  }

  async function start() {
    if (state !== "idle") return;
    wanted.current = true;
    if (!aiVoice) {
      if (!startBrowserRecognition()) onError("aiUnavailable");
      return;
    }
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
      stopTimer();
      void upload(new Blob(chunks.current, { type: (r.mimeType || "audio/webm").split(";")[0] }));
    };
    rec.current = r;
    r.start();
    setState("recording");
    startTimer();
  }

  function stop() {
    wanted.current = false;
    if (recog.current) {
      recog.current.stop();
      recog.current = null;
    }
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
        className={`flex size-24 touch-none select-none items-center justify-center rounded-full shadow-lg ${
          recording ? "animate-pulse bg-critical text-ivory-50 ring-8 ring-critical/30" : "bg-sand-300 text-navy-950 ring-8 ring-sand-300/20"
        } disabled:opacity-60`}
      >
        {recording ? <Square aria-hidden="true" className="size-9" /> : <Mic aria-hidden="true" className="size-10" />}
      </button>
      <p aria-live="polite" className="text-center text-sm font-semibold">
        {recording ? `${labels.recording} ${seconds}s / ${MAX_SECONDS}s` : state === "sending" ? labels.transcribing : labels.hold}
      </p>
      {live && (
        <p lang={LANG_TAGS[lang]} className="max-w-sm text-center text-base text-ivory-50/85">
          {live}
        </p>
      )}
    </div>
  );
}

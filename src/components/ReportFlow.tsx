"use client";

import { Camera, CircleCheck, Copy, EyeOff, Eye, Send, TriangleAlert, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { Lang, ReportType } from "@/lib/types";
import { categoryIcon } from "./categoryIcons";
import { SpeakButton } from "./SpeakButton";
import type { RecorderError, Transcript } from "./VoiceRecorder";

const VoiceRecorder = dynamic(() => import("./VoiceRecorder"), { ssr: false });

export interface ReportTypeOption {
  type: ReportType;
  label: string;
  categories: { id: string; label: string }[];
}

export interface ReportLabels {
  step1: string;
  step2: string;
  step3: string;
  hold: string;
  recording: string;
  transcribing: string;
  heard: string;
  typeLabel: string;
  photo: string;
  photoRemove: string;
  anonymous: string;
  anonymousOn: string;
  anonymousOff: string;
  submit: string;
  sending: string;
  needText: string;
  needCategory: string;
  doneTitle: string;
  doneIntro: string;
  track: string;
  newReport: string;
  copy: string;
  copied: string;
  listen: string;
  stop: string;
  errors: Record<RecorderError | "tooMany" | "offline", string>;
}

interface Props {
  lang: Lang;
  types: ReportTypeOption[];
  initialType: ReportType;
  initialCategory?: string;
  prefillText?: string;
  /** Feedback about managers is always anonymous; the toggle is hidden. */
  forceAnonymous?: boolean;
  labels: ReportLabels;
}

const MAX_SIDE = 1280;

/** Re-encode through a canvas: shrinks the upload and drops EXIF/GPS metadata before it leaves the phone. */
async function toCleanJpeg(file: File): Promise<Blob | null> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.75));
  } catch {
    return null;
  }
}

export function ReportFlow({ lang, types, initialType, initialCategory, prefillText = "", forceAnonymous = false, labels }: Props) {
  const [type, setType] = useState<ReportType>(initialType);
  const [category, setCategory] = useState(initialCategory ?? "");
  const [text, setText] = useState(prefillText);
  const [textEn, setTextEn] = useState<string | undefined>();
  const [heard, setHeard] = useState("");
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [copied, setCopied] = useState(false);

  const current = types.find((t) => t.type === type) ?? types[0];

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  function onTranscript(t: Transcript) {
    setHeard(t.text);
    setText(t.text);
    setTextEn(t.textEn);
    setError("");
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    const clean = await toCleanJpeg(file);
    if (!clean) return setError(labels.errors.generic);
    setPhoto(clean);
    setPreview(URL.createObjectURL(clean));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!category) return setError(labels.needCategory);
    if (!text.trim()) return setError(labels.needText);
    setBusy(true);
    setError("");
    const form = new FormData();
    form.set("type", type);
    form.set("category", category);
    form.set("text", text.trim());
    if (textEn && text === heard) form.set("textEn", textEn);
    form.set("lang", lang);
    form.set("anonymous", String(forceAnonymous || anonymous));
    if (photo) form.set("photo", photo, "photo.jpg");
    try {
      const res = await fetch("/api/reports", { method: "POST", body: form });
      const data = (await res.json()) as { trackingId?: string };
      if (res.ok && data.trackingId) setTrackingId(data.trackingId);
      else setError(res.status === 429 ? labels.errors.tooMany : labels.errors.generic);
    } catch {
      setError(navigator.onLine ? labels.errors.generic : labels.errors.offline);
    }
    setBusy(false);
  }

  if (trackingId) {
    const spoken = `${labels.doneIntro} ${trackingId.split("").join(" ")}`;
    return (
      <section aria-labelledby="done-title" className="flex flex-col gap-4" aria-live="polite">
        <h2 id="done-title" className="flex items-center gap-2 text-2xl font-extrabold">
          <span className="flex size-10 items-center justify-center rounded-full bg-ok text-ink-900"><CircleCheck aria-hidden="true" className="size-6" /></span>
          {labels.doneTitle}
        </h2>
        <p>{labels.doneIntro}</p>
        <p className="bg-ember rounded-4xl p-6 text-center font-mono text-4xl font-black tracking-[0.2em] ring-1 ring-cream-50/15">
          {trackingId}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(trackingId).then(() => setCopied(true))}
            className="flex min-h-12 items-center gap-2 rounded-full border-2 border-cream-50/45 px-4 font-bold"
          >
            <Copy aria-hidden="true" className="size-5" />
            {copied ? labels.copied : labels.copy}
          </button>
          <SpeakButton text={spoken} lang={lang} listenLabel={labels.listen} stopLabel={labels.stop} />
        </div>
        <Link href={`/w/report/${trackingId}`} className="flex min-h-16 items-center justify-center rounded-full bg-safety-500 text-xl font-extrabold text-ink-900">
          {labels.track}
        </Link>
        <button
          type="button"
          onClick={() => {
            setTrackingId("");
            setText("");
            setHeard("");
            setTextEn(undefined);
            setPhoto(null);
            setPreview("");
            setCategory("");
            setCopied(false);
          }}
          className="min-h-12 font-semibold text-mint-100 underline"
        >
          {labels.newReport}
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
      {types.length > 1 && (
        <div role="group" aria-label={labels.step1} className="glass-dark grid grid-cols-2 gap-1 rounded-full p-1">
          {types.map((t) => (
            <button
              key={t.type}
              type="button"
              aria-pressed={type === t.type}
              onClick={() => {
                setType(t.type);
                setCategory("");
              }}
              className={`min-h-12 rounded-full px-3 font-bold ${type === t.type ? "bg-safety-500 text-ink-900" : "text-cream-50"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <fieldset>
        <legend className="mb-3 flex items-center gap-2 text-xl font-extrabold"><span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-cream-50 text-base text-ink-900">1</span>{labels.step1}</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {current?.categories.map((c) => {
            const Icon = categoryIcon(c.id);
            const selected = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategory(c.id)}
                className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-3xl p-3 text-center font-bold transition ${
                  selected ? "bg-safety-500 text-ink-900 shadow-lg shadow-safety-500/20" : "glass-dark text-cream-50"
                }`}
              >
                <span aria-hidden="true" className={`flex size-12 items-center justify-center rounded-full ${selected ? "bg-ink-900/10" : "bg-cream-50/10"}`}><Icon className="size-7" /></span>
                <span className="leading-tight">{c.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 flex items-center gap-2 text-xl font-extrabold"><span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-cream-50 text-base text-ink-900">2</span>{labels.step2}</legend>
        <VoiceRecorder
          lang={lang}
          labels={{ hold: labels.hold, recording: labels.recording, transcribing: labels.transcribing }}
          onTranscript={onTranscript}
          onError={(e) => setError(labels.errors[e])}
        />
        {heard && (
          <p className="rounded-3xl bg-mint-100 p-4 text-ink-900">
            <span className="font-bold">{labels.heard}</span> {heard}
          </p>
        )}
        <label className="flex flex-col gap-2 text-sm font-bold uppercase tracking-wider text-cream-50/75">
          {labels.typeLabel}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={2000}
            className="rounded-3xl bg-cream-50/8 p-4 text-lg text-cream-50 ring-1 ring-cream-50/20 focus:outline-none focus:ring-2 focus:ring-safety-500"
          />
        </label>
        {preview ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimisable asset */}
            <img src={preview} alt="" className="size-20 rounded-2xl object-cover" />
            <button
              type="button"
              onClick={() => {
                setPhoto(null);
                setPreview("");
              }}
              className="flex min-h-12 items-center gap-2 rounded-full border-2 border-cream-50/45 px-4 font-semibold"
            >
              <X aria-hidden="true" className="size-5" />
              {labels.photoRemove}
            </button>
          </div>
        ) : (
          <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-3xl border-2 border-dashed border-cream-50/45 px-4 font-semibold focus-within:outline focus-within:outline-3 focus-within:outline-[var(--focus)]">
            <Camera aria-hidden="true" className="size-7 text-mint-100" />
            {labels.photo}
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => void onPhoto(e.target.files?.[0])} />
          </label>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 flex items-center gap-2 text-xl font-extrabold"><span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-cream-50 text-base text-ink-900">3</span>{labels.step3}</legend>
        {!forceAnonymous && (
          <button
            type="button"
            role="switch"
            aria-checked={anonymous}
            onClick={() => setAnonymous((a) => !a)}
            className={`flex min-h-16 items-center gap-4 rounded-3xl p-4 text-left ${anonymous ? "bg-mint-100 text-ink-900" : "bg-warn text-ink-900"}`}
          >
            {anonymous ? <EyeOff aria-hidden="true" className="size-8 shrink-0" /> : <Eye aria-hidden="true" className="size-8 shrink-0" />}
            <span className="flex flex-col">
              <span className="text-xl font-bold">{labels.anonymous}</span>
              <span className="font-semibold">{anonymous ? labels.anonymousOn : labels.anonymousOff}</span>
            </span>
          </button>
        )}
        {forceAnonymous && (
          <p className="flex items-center gap-3 rounded-3xl bg-mint-100 p-4 font-bold text-ink-900">
            <EyeOff aria-hidden="true" className="size-7 shrink-0" />
            {labels.anonymousOn}
          </p>
        )}
        <p role="alert" className="min-h-0 font-bold">
          {error && (
            <span className="flex items-start gap-2 rounded-3xl bg-critical p-4 text-cream-50">
              <TriangleAlert aria-hidden="true" className="size-6 shrink-0" />
              {error}
            </span>
          )}
        </p>
        <button
          type="submit"
          disabled={busy}
          className="flex min-h-16 items-center justify-center gap-3 rounded-full bg-safety-500 text-xl font-extrabold text-ink-900 disabled:opacity-60"
        >
          <Send aria-hidden="true" className="size-7" />
          {busy ? labels.sending : labels.submit}
        </button>
      </fieldset>
    </form>
  );
}

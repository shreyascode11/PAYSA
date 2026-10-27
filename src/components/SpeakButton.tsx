"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { LANG_TAGS } from "@/lib/lang";
import type { Lang } from "@/lib/types";

interface Props {
  text: string;
  lang: Lang;
  listenLabel: string;
  stopLabel: string;
  compact?: boolean;
}

function pickVoice(tag: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const norm = (s: string) => s.replace("_", "-").toLowerCase();
  return voices.find((v) => norm(v.lang) === tag.toLowerCase()) ?? voices.find((v) => norm(v.lang).startsWith(tag.slice(0, 2)));
}

/** Reads screen content aloud with the browser's free, offline-capable speech engine. */
export function SpeakButton({ text, lang, listenLabel, stopLabel, compact = false }: Props) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  function toggle() {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG_TAGS[lang];
    const voice = pickVoice(u.lang);
    if (voice) u.voice = voice;
    u.rate = 0.9;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  }

  if (!supported) return null;
  const Icon = speaking ? VolumeX : Volume2;
  const label = speaking ? stopLabel : listenLabel;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={speaking}
      className={`inline-flex min-h-12 items-center gap-2 rounded-full bg-mint-100 font-bold text-ink-900 ${
        compact ? "min-w-12 justify-center px-2" : "px-4 text-lg"
      }`}
    >
      <Icon aria-hidden="true" className="size-6" />
      {!compact && <span>{label}</span>}
    </button>
  );
}

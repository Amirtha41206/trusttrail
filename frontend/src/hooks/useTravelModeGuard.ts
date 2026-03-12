import { useEffect, useRef, useCallback } from "react";

// ── Browser SpeechRecognition type declarations ───────────────────────────────
// TypeScript doesn't include these by default — we declare them here.
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult:  ((e: SpeechRecognitionEvent) => void) | null;
  onerror:   ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend:     (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition:       new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

// ── Panic keywords ────────────────────────────────────────────────────────────
const PANIC_WORDS = [
  "help", "help me", "helpme",
  "danger", "dangerous",
  "stop", "stop it", "leave me", "leave me alone",
  "fire", "thief", "robbery",
  "rape", "attack", "attacking",
  "emergency", "police",
  "save me", "saveme",
  "bachao", "choro", "chhodo",
  "aidez", "au secours",
  "ayuda",
];

// ── Volume thresholds ─────────────────────────────────────────────────────────
const VOLUME_THRESHOLD  = 72;   // 0–100 normalised (~scream level)
const RAISED_SUSTAIN_MS = 1800; // stay loud for 1.8 s to trigger
const VOLUME_POLL_MS    = 200;

// ── Exported type ─────────────────────────────────────────────────────────────
export type GuardStatus =
  | "off"
  | "listening"
  | "panic_word"
  | "raised_voice"
  | "mic_denied"
  | "speech_error";

interface Options {
  enabled:        boolean;
  onPanicWord:    (word: string) => void;
  onVoiceRaised:  () => void;
  onStatusChange: (s: GuardStatus) => void;
}

export function useTravelModeGuard({
  enabled,
  onPanicWord,
  onVoiceRaised,
  onStatusChange,
}: Options) {
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const audioCtxRef    = useRef<AudioContext | null>(null);
  const analyserRef    = useRef<AnalyserNode | null>(null);
  const micStreamRef   = useRef<MediaStream | null>(null);
  const pollTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const raisedSinceRef = useRef<number | null>(null);
  const firedRef       = useRef(false);

  // ── Stop everything ──────────────────────────────────────────────────────
  const stopGuard = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch (_) {}
    recognitionRef.current = null;

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = null;

    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;

    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;

    raisedSinceRef.current = null;
    firedRef.current = false;
    onStatusChange("off");
  }, [onStatusChange]);

  // ── Start everything ─────────────────────────────────────────────────────
  const startGuard = useCallback(async () => {
    firedRef.current = false;
    onStatusChange("listening");

    // 1. Speech recognition ──────────────────────────────────────────────────
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

    if (SR) {
      const recog = new SR();
      recog.continuous     = true;
      recog.interimResults = true;
      recog.lang           = "en-IN";

      recog.onresult = (event: SpeechRecognitionEvent) => {
        if (firedRef.current) return;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript.toLowerCase().trim();
          for (const word of PANIC_WORDS) {
            if (text.includes(word)) {
              firedRef.current = true;
              onStatusChange("panic_word");
              onPanicWord(word);
              return;
            }
          }
        }
      };

      recog.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (e.error === "not-allowed") onStatusChange("mic_denied");
        else onStatusChange("speech_error");
      };

      recog.onend = () => {
        if (enabled && !firedRef.current) {
          try { recog.start(); } catch (_) {}
        }
      };

      try {
        recog.start();
        recognitionRef.current = recog;
      } catch (_) {}
    }

    // 2. Volume analyser ─────────────────────────────────────────────────────
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = (
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      ) as typeof AudioContext;

      const ctx      = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);

      pollTimerRef.current = setInterval(() => {
        if (firedRef.current) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length;
        const vol = (avg / 255) * 100;

        if (vol >= VOLUME_THRESHOLD) {
          if (!raisedSinceRef.current) {
            raisedSinceRef.current = Date.now();
          } else if (Date.now() - raisedSinceRef.current >= RAISED_SUSTAIN_MS) {
            firedRef.current       = true;
            raisedSinceRef.current = null;
            onStatusChange("raised_voice");
            onVoiceRaised();
          }
        } else {
          raisedSinceRef.current = null;
        }
      }, VOLUME_POLL_MS);

    } catch (err) {
      if ((err as Error)?.name === "NotAllowedError") onStatusChange("mic_denied");
    }
  }, [enabled, onPanicWord, onVoiceRaised, onStatusChange]);

  // ── Wire to enabled flag ─────────────────────────────────────────────────
  useEffect(() => {
    if (enabled) startGuard();
    else stopGuard();
    return () => stopGuard();
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps
}
import { useEffect, useRef, useCallback } from "react";

// ── Browser SpeechRecognition type declarations ───────────────────────────────
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult:      ((e: SpeechRecognitionEvent) => void) | null;
  onerror:       ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend:         (() => void) | null;
  onstart:       (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend:   (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition:       new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

// ── Tier-1: fire instantly on any match (even interim) ───────────────────────
const PANIC_TIER1 = [
  "help", "bachao", "ayuda", "aidez",
];

// ── Tier-2: require final result + confidence threshold ───────────────────────
const PANIC_TIER2 = [
  "help me", "danger", "dangerous",
  "stop it", "leave me", "leave me alone",
  "fire", "thief", "robbery",
  "rape", "attack", "attacking",
  "emergency", "police",
  "save me", "saveme",
  "choro", "chhodo", "au secours",
];

const CONFIDENCE_THRESHOLD = 0.60;
const DEBOUNCE_MS          = 2000;

// ── Volume thresholds ─────────────────────────────────────────────────────────
const VOLUME_THRESHOLD  = 70;
const RAISED_SUSTAIN_MS = 1800;
const VOLUME_POLL_MS    = 200;

// ── Exported type ─────────────────────────────────────────────────────────────
export type GuardStatus =
  | "off"
  | "listening"
  | "panic_word"
  | "raised_voice"
  | "mic_denied"
  | "speech_error"
  | "not_supported";

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
  const recognitionRef  = useRef<ISpeechRecognition | null>(null);
  const audioCtxRef     = useRef<AudioContext | null>(null);
  const analyserRef     = useRef<AnalyserNode | null>(null);
  const micStreamRef    = useRef<MediaStream | null>(null);
  const pollTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raisedSinceRef  = useRef<number | null>(null);
  const lastTriggerRef  = useRef<number>(0);
  const firedRef        = useRef(false);
  const enabledRef      = useRef(enabled);
  const isRestartingRef = useRef(false);

  // keep enabledRef in sync
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  // ── Stop everything ───────────────────────────────────────────────────────
  const stopGuard = useCallback(() => {
    enabledRef.current = false;

    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = null;

    try { recognitionRef.current?.abort(); } catch (_) {}
    recognitionRef.current = null;

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = null;

    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;

    try { audioCtxRef.current?.close(); } catch (_) {}
    audioCtxRef.current = null;
    analyserRef.current = null;

    raisedSinceRef.current = null;
    firedRef.current       = false;
    isRestartingRef.current = false;
    onStatusChange("off");
  }, [onStatusChange]);

  // ── Start speech recognition ──────────────────────────────────────────────
  const startSpeech = useCallback(() => {
    try { recognitionRef.current?.abort(); } catch (_) {}
    recognitionRef.current = null;
    isRestartingRef.current = false;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (!SR) {
      console.warn("[TravelGuard] SpeechRecognition not supported.");
      onStatusChange("not_supported");
      return;
    }

    const recog = new SR();
    recog.continuous      = true;
    recog.interimResults  = true;
    recog.lang            = "en-IN";
    recog.maxAlternatives = 3;

    recog.onstart = () => {
      console.log("[TravelGuard] 🎙️ Listening started");
    };

    recog.onresult = (event: SpeechRecognitionEvent) => {
      if (firedRef.current || !enabledRef.current) return;
      const now = Date.now();
      if (now - lastTriggerRef.current < DEBOUNCE_MS) return;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result  = event.results[i];
        const isFinal = result.isFinal;

        for (let a = 0; a < result.length; a++) {
          const text       = result[a].transcript.toLowerCase().trim();
          const confidence = result[a].confidence ?? 1.0;
          console.log(`[TravelGuard] Heard: "${text}" (conf: ${confidence.toFixed(2)}, final: ${isFinal})`);

          // Tier-1 — fire immediately even on interim
          for (const word of PANIC_TIER1) {
            if (text.includes(word)) {
              console.log(`[TravelGuard] 🚨 TIER-1: "${word}"`);
              lastTriggerRef.current = now;
              firedRef.current = true;
              onStatusChange("panic_word");
              onPanicWord(word);
              return;
            }
          }

          // Tier-2 — final result + confidence check
          if (isFinal && confidence >= CONFIDENCE_THRESHOLD) {
            for (const word of PANIC_TIER2) {
              if (text.includes(word)) {
                console.log(`[TravelGuard] 🚨 TIER-2: "${word}"`);
                lastTriggerRef.current = now;
                firedRef.current = true;
                onStatusChange("panic_word");
                onPanicWord(word);
                return;
              }
            }
          }
        }
      }
    };

    recog.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.warn(`[TravelGuard] Speech error: ${e.error}`);
      if (!enabledRef.current) return;

      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        onStatusChange("mic_denied"); return;
      }
      if (e.error === "no-speech" || e.error === "aborted") return;
      if (e.error === "network" || e.error === "audio-capture") {
        onStatusChange("speech_error");
        restartTimerRef.current = setTimeout(() => {
          if (enabledRef.current && !firedRef.current) startSpeech();
        }, 2000);
      }
    };

    recog.onend = () => {
      console.log("[TravelGuard] Session ended");
      isRestartingRef.current = false;
      if (!enabledRef.current || firedRef.current) return;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      restartTimerRef.current = setTimeout(() => {
        if (enabledRef.current && !firedRef.current && !isRestartingRef.current) {
          isRestartingRef.current = true;
          startSpeech();
        }
      }, 150);
    };

    try {
      recog.start();
      recognitionRef.current = recog;
    } catch (err) {
      console.warn("[TravelGuard] Could not start:", err);
    }
  }, [onPanicWord, onStatusChange]);

  // ── Start volume analyser ─────────────────────────────────────────────────
  const startVolume = useCallback(async () => {
    // check permission first
    try {
      const perm = await navigator.permissions.query({ name: "microphone" as PermissionName });
      if (perm.state === "denied") { onStatusChange("mic_denied"); return; }
    } catch (_) { /* permissions API unavailable — proceed */ }

    // retry mic init up to 3 times
    const tryGetMic = async (attempt: number): Promise<MediaStream | null> => {
      try {
        return await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
          video: false,
        });
      } catch (err) {
        const error = err as Error;
        console.warn(`[TravelGuard] Mic attempt ${attempt} failed: ${error.name}`);
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") return null;
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 500 * attempt));
          return tryGetMic(attempt + 1);
        }
        return null;
      }
    };

    try {
      const stream = await tryGetMic(1);
      if (!stream) { onStatusChange("mic_denied"); return; }
      micStreamRef.current = stream;

      const AudioCtx = (
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      ) as typeof AudioContext;

      const ctx      = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize              = 512;
      analyser.smoothingTimeConstant = 0.5;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      console.log("[TravelGuard] 🔊 Volume analyser started");

      pollTimerRef.current = setInterval(() => {
        if (firedRef.current || !enabledRef.current) return;
        analyser.getByteFrequencyData(data);

        // RMS for accurate loudness
        const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length);
        const vol = (rms / 128) * 100;

        if (vol >= VOLUME_THRESHOLD) {
          if (!raisedSinceRef.current) {
            raisedSinceRef.current = Date.now();
            console.log(`[TravelGuard] Loud sound detected (${vol.toFixed(1)}), timing...`);
          } else if (Date.now() - raisedSinceRef.current >= RAISED_SUSTAIN_MS) {
            console.log("[TravelGuard] 🚨 RAISED VOICE — SOS triggered");
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
      const error = err as Error;
      console.warn("[TravelGuard] Volume analyser failed:", error.name);
      if (error.name === "NotAllowedError") onStatusChange("mic_denied");
    }
  }, [onVoiceRaised, onStatusChange]);

  // ── Main start ────────────────────────────────────────────────────────────
  const startGuard = useCallback(async () => {
    firedRef.current        = false;
    enabledRef.current      = true;
    raisedSinceRef.current  = null;
    lastTriggerRef.current  = 0;
    onStatusChange("listening");
    startSpeech();
    await startVolume();
  }, [startSpeech, startVolume, onStatusChange]);

  // ── Wire to enabled ───────────────────────────────────────────────────────
  useEffect(() => {
    if (enabled) startGuard();
    else stopGuard();
    return () => stopGuard();
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps
}
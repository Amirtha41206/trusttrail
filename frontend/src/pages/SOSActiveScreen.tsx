import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";

export default function SOSActiveScreen() {
  const { contacts, setSosActive } = useApp();
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<Record<string, "sending" | "sent">>(
    Object.fromEntries(contacts.map((c) => [c.id, "sending" as const]))
  );
  const [camStatus, setCamStatus] = useState<"requesting" | "recording" | "denied">("requesting");
  const [micStatus, setMicStatus] = useState<"requesting" | "recording" | "denied">("requesting");
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    contacts.forEach((c, i) => {
      setTimeout(() => {
        setStatuses((prev) => ({ ...prev, [c.id]: "sent" }));
      }, 200 + i * 300);
    });
  }, [contacts]);

  useEffect(() => {
    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        mediaStreamRef.current = stream;
        setCamStatus("recording");
        setMicStatus("recording");

        const recorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `evidence-${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
          console.log("Evidence saved:", blob.size, "bytes");
        };

        recorder.start(1000);
        recorderRef.current = recorder;

        timerRef.current = setInterval(() => {
          setRecordingTime((t) => t + 1);
        }, 1000);
      } catch {
        setCamStatus("denied");
        setMicStatus("denied");
      }
    };

    startRecording();

    return () => {
      recorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopSOS = () => {
    recorderRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    setSosActive(false);
    navigate("/home");
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="app-container min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[1, 2, 3].map((i) => (
          <div key={i} className="absolute w-48 h-48 rounded-full border-2 border-primary/30"
            style={{ animation: `red-pulse-ring 2s ease-out infinite ${i * 0.5}s` }} />
        ))}
      </div>

      <div className="relative z-10 text-center mb-6 animate-fade-in">
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-glow-pulse">
          <span className="text-4xl">🚨</span>
        </div>
        <h1 className="text-3xl font-heading font-extrabold text-primary mb-2">SOS ACTIVE</h1>
        <p className="text-sm text-muted-foreground font-body">Alerting your emergency contacts</p>
      </div>

      <div className="relative z-10 w-full p-3 bg-primary/10 border border-primary/20 rounded-xl mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] text-primary font-heading font-bold">AUTO EVIDENCE COLLECTION</p>
          {camStatus === "recording" && (
            <span className="text-[10px] font-body text-primary font-bold animate-pulse">
              REC {formatTime(recordingTime)}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-card rounded-lg p-2 text-center border border-border">
            <p className="text-lg">📷</p>
            <p className="text-[10px] text-muted-foreground">Camera</p>
            <p className={`text-[10px] font-bold ${camStatus === "recording" ? "text-primary" : camStatus === "denied" ? "text-yellow" : "text-muted-foreground"}`}>
              {camStatus === "recording" ? "● Recording" : camStatus === "denied" ? "Denied" : "Starting..."}
            </p>
          </div>
          <div className="flex-1 bg-card rounded-lg p-2 text-center border border-border">
            <p className="text-lg">🎙️</p>
            <p className="text-[10px] text-muted-foreground">Audio</p>
            <p className={`text-[10px] font-bold ${micStatus === "recording" ? "text-primary" : micStatus === "denied" ? "text-yellow" : "text-muted-foreground"}`}>
              {micStatus === "recording" ? "● Recording" : micStatus === "denied" ? "Denied" : "Starting..."}
            </p>
          </div>
          <div className="flex-1 bg-card rounded-lg p-2 text-center border border-border">
            <p className="text-lg">📍</p>
            <p className="text-[10px] text-muted-foreground">Location</p>
            <p className="text-[10px] text-teal font-bold">● LIVE</p>
          </div>
        </div>
        {camStatus === "denied" && (
          <p className="text-[10px] text-yellow font-body mt-2 text-center">
            Allow camera and mic permission for evidence collection
          </p>
        )}
        {camStatus === "recording" && (
          <p className="text-[10px] text-muted-foreground font-body mt-2 text-center">
            Evidence will auto-save when you stop SOS
          </p>
        )}
      </div>

      <div className="relative z-10 w-full space-y-2.5 mb-4">
        {contacts.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3 bg-card/80 backdrop-blur rounded-xl border border-border">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-heading font-bold text-primary-foreground" style={{ backgroundColor: c.color }}>
              {c.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-body font-semibold text-foreground">{c.name}</p>
              <p className="text-[10px] text-muted-foreground font-body">{c.rel}</p>
            </div>
            <span className="text-sm">{statuses[c.id] === "sending" ? "⏳" : "✅"}</span>
            <span className="text-[10px] font-body text-muted-foreground">
              {statuses[c.id] === "sending" ? "Sending..." : "Alert sent"}
            </span>
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full p-3 bg-teal/10 border border-teal/20 rounded-xl mb-4 flex items-center gap-3">
        <div className="relative">
          <div className="w-3 h-3 rounded-full bg-teal" />
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-teal animate-pulse-dot" />
        </div>
        <p className="text-sm font-body text-teal">Live location being shared</p>
      </div>

      <div className="relative z-10 w-full p-3 bg-yellow/10 border border-yellow/20 rounded-xl mb-6">
        <p className="text-xs font-body text-yellow text-center mb-3">Call for immediate help</p>
        <div className="flex gap-3">
          <a href="tel:100" className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-yellow/20 border border-yellow/40 rounded-xl active:scale-95 transition-transform">
            <span className="text-lg">📞</span>
            <div>
              <p className="text-sm font-heading font-extrabold text-yellow">100</p>
              <p className="text-[10px] text-muted-foreground font-body">Police</p>
            </div>
          </a>
          <a href="tel:1091" className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-primary/20 border border-primary/40 rounded-xl active:scale-95 transition-transform">
            <span className="text-lg">📞</span>
            <div>
              <p className="text-sm font-heading font-extrabold text-primary">1091</p>
              <p className="text-[10px] text-muted-foreground font-body">Women Helpline</p>
            </div>
          </a>
        </div>
      </div>

      <button onClick={stopSOS}
        className="relative z-10 w-full py-3.5 bg-teal text-accent-foreground font-heading font-bold text-lg rounded-xl hover:brightness-110 active:scale-[0.98] transition-all">
        I am Safe - Stop SOS
      </button>

    </div>
  );
}


import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import BottomNav from "@/components/BottomNav";
import { useTravelModeGuard, GuardStatus } from "@/hooks/useTravelModeGuard";

export default function HomeScreen() {
  const { user, travellers, alerts, setSosActive } = useApp();
  const navigate = useNavigate();

  const [showSosModal, setShowSosModal] = useState(false);
  const [countdown, setCountdown]       = useState(2);
  const [counting, setCounting]         = useState(false);
  const [travelMode, setTravelMode]     = useState(false);
  const [guardStatus, setGuardStatus]   = useState<GuardStatus>("off");

  // ── Central SOS trigger ───────────────────────────────────────────────────
  const triggerSOS = useCallback((reason: string = "") => {
    setShowSosModal(false);
    setCounting(false);
    setSosActive(true);
    navigate("/sos-active", { state: { reason } });
  }, [navigate, setSosActive]);

  // ── Voice + volume guard ──────────────────────────────────────────────────
  useTravelModeGuard({
    enabled:        travelMode,
    onPanicWord:    (word) => triggerSOS(`Panic word detected: "${word}"`),
    onVoiceRaised:  ()     => triggerSOS("Raised voice / scream detected"),
    onStatusChange: setGuardStatus,
  });

  // ── Manual tap / S-key shortcuts ──────────────────────────────────────────
  const tapCount   = useRef(0);
  const tapTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spaceCount = useRef(0);
  const spaceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!travelMode) return;

    const handleTap = () => {
      tapCount.current++;
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
      if (tapCount.current >= 5) { tapCount.current = 0; triggerSOS("5 rapid taps detected"); }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "s" || e.key === "S") {
        spaceCount.current++;
        if (spaceTimer.current) clearTimeout(spaceTimer.current);
        spaceTimer.current = setTimeout(() => { spaceCount.current = 0; }, 1500);
        if (spaceCount.current >= 3) { spaceCount.current = 0; triggerSOS("S-key panic trigger"); }
      }
    };

    document.addEventListener("click", handleTap);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleTap);
      document.removeEventListener("keydown", handleKey);
    };
  }, [travelMode, triggerSOS]);

  // ── Countdown SOS modal ───────────────────────────────────────────────────
  useEffect(() => {
    if (!counting) return;
    if (countdown <= 0) {
      setCounting(false);
      setShowSosModal(false);
      triggerSOS("Manual SOS button");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [counting, countdown, triggerSOS]);

  const startSOS  = () => { setShowSosModal(true); setCountdown(2); setCounting(true); };
  const cancelSOS = () => { setShowSosModal(false); setCounting(false); setCountdown(2); };

  // ── Guard status display config ───────────────────────────────────────────
  const guardUI: Record<string, { dot: string; text: string; pulse: boolean; bg: string; border: string } | null> = {
    off:           null,
    listening:     { dot: "#00d9a3", text: "🎙️ Say 'help', 'danger', 'bachao' clearly…",     pulse: true,  bg: "rgba(0,217,163,0.07)",  border: "rgba(0,217,163,0.25)"  },
    panic_word:    { dot: "#ff2d55", text: "⚠️ Panic word heard — SOS triggered!",            pulse: false, bg: "rgba(255,45,85,0.10)",  border: "rgba(255,45,85,0.35)"  },
    raised_voice:  { dot: "#ff2d55", text: "⚠️ Raised voice detected — SOS triggered!",       pulse: false, bg: "rgba(255,45,85,0.10)",  border: "rgba(255,45,85,0.35)"  },
    mic_denied:    { dot: "#f5c518", text: "⚠️ Mic denied — allow mic in browser settings",   pulse: false, bg: "rgba(245,197,24,0.08)", border: "rgba(245,197,24,0.30)" },
    speech_error:  { dot: "#f5c518", text: "⚠️ Speech error — retrying…",                    pulse: false, bg: "rgba(245,197,24,0.08)", border: "rgba(245,197,24,0.30)" },
    not_supported: { dot: "#f5c518", text: "⚠️ Voice unavailable — use tap or S-key trigger", pulse: false, bg: "rgba(245,197,24,0.08)", border: "rgba(245,197,24,0.30)" },
  };
  const guardInfo = guardUI[guardStatus] ?? null;

  // ── Quick actions ─────────────────────────────────────────────────────────
  const quickActions = [
    { icon: "🗺️", label: "Safety Map",        path: "/map"                  },
    { icon: "👥", label: "Trusted Travellers", path: "/travellers"           },
    { icon: "🧭", label: "Journey Mode",       path: "/journey"              },
    { icon: "📢", label: "Report",             path: "/report"               },
    { icon: "🔑", label: "Safe Word",          path: "/safe-word"            },
    { icon: "🤖", label: "AI Complaint",       path: "/report?tab=complaint" },
    { icon: "✋", label: "Gesture SOS",        path: "/gesture"              },
  ];

  const levelColors: Record<string, string> = {
    danger:  "bg-primary/20 text-primary border-primary/30",
    warning: "bg-yellow/20 text-yellow border-yellow/30",
    safe:    "bg-teal/20 text-teal border-teal/30",
  };

  return (
    <div className="app-container pb-24">

      <style>{`
        @keyframes guard-ping {
          0%   { transform: scale(1);   opacity: 0.9; }
          100% { transform: scale(2.6); opacity: 0;   }
        }
        @keyframes mic-breathe {
          0%,100% { opacity: 1;    transform: scale(1);    }
          50%     { opacity: 0.45; transform: scale(0.85); }
        }
        .guard-ping  { animation: guard-ping  1.5s ease-out     infinite; }
        .mic-breathe { animation: mic-breathe 1.4s ease-in-out  infinite; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-6">
        <div>
          <p className="text-sm text-muted-foreground font-body">Good evening,</p>
          <h1 className="text-xl font-heading font-extrabold text-foreground">{user.name} 👋</h1>
        </div>
        <button
          onClick={() => navigate("/profile")}
          className="w-10 h-10 bg-card rounded-full flex items-center justify-center text-xl border border-border"
        >
          {user.avatar}
        </button>
      </div>

      {/* Safe Banner */}
      <div className="mx-4 mb-4 p-3.5 rounded-xl bg-teal/10 border border-teal/20 flex items-center gap-3">
        <div className="relative">
          <div className="w-3 h-3 rounded-full bg-teal" />
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-teal animate-pulse-dot" />
        </div>
        <div>
          <p className="text-sm font-body font-semibold text-teal">You are in a safe area</p>
          <p className="text-xs text-muted-foreground font-body">Location: T. Nagar, Chennai</p>
        </div>
      </div>

      {/* Travel Mode Toggle */}
      <div
        onClick={() => setTravelMode((v) => !v)}
        className={`mx-4 mb-2 p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
          travelMode ? "bg-primary/10 border-primary/40" : "bg-card border-border"
        }`}
      >
        <span className="text-2xl">🚗</span>
        <div className="flex-1">
          <p className="text-sm font-heading font-bold text-foreground">
            Travel Mode{" "}
            <span className={travelMode ? "text-primary" : "text-muted-foreground"}>
              {travelMode ? "ON" : "OFF"}
            </span>
          </p>
          <p className="text-xs text-muted-foreground font-body">
            {travelMode
              ? "AI voice guard active — monitoring for panic words"
              : "Turn on while travelling alone"}
          </p>
        </div>
        <div className={`w-10 h-5 rounded-full transition-all relative ${travelMode ? "bg-primary" : "bg-muted"}`}>
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${travelMode ? "left-5" : "left-0.5"}`} />
        </div>
      </div>

      {/* Guard status pill */}
      {travelMode && guardInfo && (
        <div
          className="mx-4 mb-3 p-3 rounded-xl flex items-center gap-3"
          style={{ background: guardInfo.bg, border: `1px solid ${guardInfo.border}` }}
        >
          <div className="relative flex-shrink-0" style={{ width: 10, height: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: guardInfo.dot }} />
            {guardInfo.pulse && (
              <div
                className="guard-ping"
                style={{ position: "absolute", inset: 0, borderRadius: "50%", background: guardInfo.dot }}
              />
            )}
          </div>
          <span className="text-xs font-body font-semibold flex-1" style={{ color: guardInfo.dot }}>
            {guardInfo.text}
          </span>
          {guardStatus === "listening" && (
            <span className="text-base mic-breathe">🎙️</span>
          )}
        </div>
      )}

      {/* Panic triggers hint */}
      {travelMode && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-[11px] text-primary font-heading font-bold mb-1.5">PANIC TRIGGERS ACTIVE</p>
          {[
            `🎙️ Say "help", "danger", "bachao" → instant SOS`,
            `📢 Scream or raise voice for 2 s → auto SOS`,
            `📲 Tap screen 5× fast → instant SOS`,
            `⌨️ Press S key 3× fast → silent SOS`,
          ].map((tip, i) => (
            <p key={i} className="text-[11px] text-muted-foreground font-body leading-relaxed">{tip}</p>
          ))}
        </div>
      )}

      {/* SOS Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={startSOS}
          className="relative w-24 h-24 rounded-full bg-primary flex items-center justify-center transition-transform active:scale-95"
        >
          <div className="absolute inset-0 rounded-full bg-primary/30" style={{ animation: "sos-ring 2s ease-out infinite" }} />
          <div className="absolute inset-0 rounded-full bg-primary/20" style={{ animation: "sos-ring 2s ease-out infinite 0.5s" }} />
          <span className="text-primary-foreground font-heading font-extrabold text-xl z-10">SOS</span>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <h2 className="text-base font-heading font-bold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className="flex flex-col items-center gap-2 p-3 bg-card rounded-xl border border-border hover:border-primary/30 hover:bg-card/80 transition-all active:scale-95"
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-[11px] font-body font-medium text-muted-foreground text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nearby Trusted */}
      <div className="px-4 mb-6">
        <h2 className="text-base font-heading font-bold text-foreground mb-3">Nearby Trusted</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {travellers.slice(0, 4).map((t) => (
            <div key={t.id} className="flex-shrink-0 w-28 p-3 bg-card rounded-xl border border-border text-center">
              <span className="text-2xl">{t.emoji}</span>
              <p className="text-xs font-body font-semibold text-foreground mt-1 truncate">{t.name}</p>
              <p className="text-[10px] text-muted-foreground font-body">{t.type}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Area Alerts */}
      <div className="px-4 mb-6">
        <h2 className="text-base font-heading font-bold text-foreground mb-3">Area Alerts</h2>
        <div className="space-y-2.5">
          {alerts.map((a) => (
            <div key={a.id} className={`p-3 rounded-xl border ${levelColors[a.level]}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-heading font-bold">{a.area}</span>
                <span className="text-[10px] font-body opacity-70">{a.time}</span>
              </div>
              <p className="text-xs font-body opacity-90">{a.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SOS countdown modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md">
          <div className="text-center animate-fade-in">
            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke="hsl(var(--primary))" strokeWidth="4"
                  strokeDasharray="283"
                  className="animate-countdown-ring"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-heading font-extrabold text-primary">{countdown}</span>
              </div>
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground mb-2">Sending SOS Alert</h2>
            <p className="text-sm text-muted-foreground font-body mb-6">Alerting your emergency contacts...</p>
            <button
              onClick={cancelSOS}
              className="px-8 py-3 bg-card border border-border rounded-xl text-foreground font-body font-semibold hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import BottomNav from "@/components/BottomNav";

export default function HomeScreen() {
  const { user, travellers, alerts, setSosActive } = useApp();
  const navigate = useNavigate();
  const [showSosModal, setShowSosModal] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    if (!counting) return;
    if (countdown <= 0) {
      setCounting(false);
      setShowSosModal(false);
      setSosActive(true);
      navigate("/sos-active");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [counting, countdown, navigate, setSosActive]);

  const startSOS = () => {
    setShowSosModal(true);
    setCountdown(5);
    setCounting(true);
  };

  const cancelSOS = () => {
    setShowSosModal(false);
    setCounting(false);
    setCountdown(5);
  };

  const quickActions = [
    { icon: "🗺️", label: "Safety Map", path: "/map" },
    { icon: "👥", label: "Trusted Travellers", path: "/travellers" },
    { icon: "🧭", label: "Journey Mode", path: "/journey" },
    { icon: "📢", label: "Report", path: "/report" },
    { icon: "🔑", label: "Safe Word", path: "/safe-word" },
    { icon: "🤖", label: "AI Complaint", path: "/report?tab=complaint" },
  ];

  const levelColors: Record<string, string> = {
    danger: "bg-primary/20 text-primary border-primary/30",
    warning: "bg-yellow/20 text-yellow border-yellow/30",
    safe: "bg-teal/20 text-teal border-teal/30",
  };

  return (
    <div className="app-container pb-24">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-6">
        <div>
          <p className="text-sm text-muted-foreground font-body">Good evening,</p>
          <h1 className="text-xl font-heading font-extrabold text-foreground">{user.name} 👋</h1>
        </div>
        <button onClick={() => navigate("/profile")} className="w-10 h-10 bg-card rounded-full flex items-center justify-center text-xl border border-border">
          {user.avatar}
        </button>
      </div>

      {/* Safe Banner */}
      <div className="mx-4 mb-5 p-3.5 rounded-xl bg-teal/10 border border-teal/20 flex items-center gap-3">
        <div className="relative">
          <div className="w-3 h-3 rounded-full bg-teal" />
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-teal animate-pulse-dot" />
        </div>
        <div>
          <p className="text-sm font-body font-semibold text-teal">You're in a safe area</p>
          <p className="text-xs text-muted-foreground font-body">Location: T. Nagar, Chennai</p>
        </div>
      </div>

      {/* SOS Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={startSOS}
          className="relative w-24 h-24 rounded-full bg-primary flex items-center justify-center animate-sos-pulse transition-transform active:scale-95"
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

      {/* SOS Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md">
          <div className="text-center animate-fade-in">
            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
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
            <button onClick={cancelSOS} className="px-8 py-3 bg-card border border-border rounded-xl text-foreground font-body font-semibold hover:bg-secondary transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

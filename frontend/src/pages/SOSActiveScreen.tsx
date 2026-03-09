import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";

export default function SOSActiveScreen() {
  const { contacts, setSosActive } = useApp();
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<Record<string, "sending" | "sent">>(
    Object.fromEntries(contacts.map((c) => [c.id, "sending" as const]))
  );

  useEffect(() => {
    contacts.forEach((c, i) => {
      setTimeout(() => {
        setStatuses((prev) => ({ ...prev, [c.id]: "sent" }));
      }, 1500 + i * 800);
    });
  }, [contacts]);

  const stopSOS = () => {
    setSosActive(false);
    navigate("/home");
  };

  return (
    <div className="app-container min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Pulsing rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[1, 2, 3].map((i) => (
          <div key={i} className="absolute w-48 h-48 rounded-full border-2 border-primary/30"
            style={{ animation: `red-pulse-ring 2s ease-out infinite ${i * 0.5}s` }} />
        ))}
      </div>

      {/* SOS Active */}
      <div className="relative z-10 text-center mb-8 animate-fade-in">
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-glow-pulse">
          <span className="text-4xl">🚨</span>
        </div>
        <h1 className="text-3xl font-heading font-extrabold text-primary mb-2">SOS ACTIVE</h1>
        <p className="text-sm text-muted-foreground font-body">Alerting your emergency contacts</p>
      </div>

      {/* Contact statuses */}
      <div className="relative z-10 w-full space-y-2.5 mb-8">
        {contacts.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3 bg-card/80 backdrop-blur rounded-xl border border-border">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-heading font-bold text-primary-foreground" style={{ backgroundColor: c.color }}>
              {c.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-body font-semibold text-foreground">{c.name}</p>
              <p className="text-[10px] text-muted-foreground font-body">{c.rel}</p>
            </div>
            <span className="text-sm">
              {statuses[c.id] === "sending" ? "⏳" : "✅"}
            </span>
            <span className="text-[10px] font-body text-muted-foreground">
              {statuses[c.id] === "sending" ? "Sending..." : "Alert sent"}
            </span>
          </div>
        ))}
      </div>

      {/* Location */}
      <div className="relative z-10 w-full p-3 bg-teal/10 border border-teal/20 rounded-xl mb-4 flex items-center gap-3">
        <div className="relative">
          <div className="w-3 h-3 rounded-full bg-teal" />
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-teal animate-pulse-dot" />
        </div>
        <p className="text-sm font-body text-teal">Live location being shared</p>
      </div>

      {/* Police note */}
      <div className="relative z-10 w-full p-3 bg-yellow/10 border border-yellow/20 rounded-xl mb-6">
        <p className="text-xs font-body text-yellow text-center">
          🚔 For police assistance, call <b>100</b> or Women Helpline <b>1091</b>
        </p>
      </div>

      {/* Stop button */}
      <button onClick={stopSOS}
        className="relative z-10 w-full py-3.5 bg-teal text-accent-foreground font-heading font-bold text-lg rounded-xl hover:brightness-110 active:scale-[0.98] transition-all">
        ✅ I'm Safe — Stop SOS
      </button>
    </div>
  );
}

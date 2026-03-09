import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import BackButton from "@/components/BackButton";

const travelModes = [
  { icon: "🛺", label: "Auto" },
  { icon: "🚕", label: "Cab" },
  { icon: "🚌", label: "Bus" },
  { icon: "🚶‍♀️", label: "Walk" },
];

export default function JourneyModeScreen() {
  const { contacts, journey, setJourney } = useApp();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState("Auto");
  const [eta, setEta] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!journey?.active) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [journey?.active]);

  const startJourney = () => {
    setJourney({ from, to, mode, expectedArrival: eta, active: true, startedAt: Date.now() });
  };

  const arrivedSafely = () => {
    setJourney(null);
    setElapsed(0);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="app-container min-h-screen pb-8">
      <div className="p-4 pt-6 flex items-center gap-3">
        <BackButton />
        <h1 className="text-xl font-heading font-extrabold text-foreground">Journey Mode</h1>
      </div>

      {!journey?.active ? (
        <div className="px-4 space-y-4 animate-fade-in">
          <input placeholder="From" value={from} onChange={(e) => setFrom(e.target.value)}
            className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input placeholder="To" value={to} onChange={(e) => setTo(e.target.value)}
            className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/50" />

          {/* Travel Mode */}
          <div>
            <p className="text-sm text-muted-foreground font-body mb-2">Travel Mode</p>
            <div className="grid grid-cols-4 gap-2">
              {travelModes.map((m) => (
                <button key={m.label} onClick={() => setMode(m.label)}
                  className={`flex flex-col items-center p-3 rounded-xl border transition-all ${mode === m.label ? "bg-primary/20 border-primary/50 text-primary" : "bg-card border-border text-muted-foreground"}`}>
                  <span className="text-xl">{m.icon}</span>
                  <span className="text-[10px] font-body font-medium mt-1">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground font-body mb-2">Expected Arrival</p>
            <input type="time" value={eta} onChange={(e) => setEta(e.target.value)}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>

          {/* Contacts to notify */}
          <div>
            <p className="text-sm text-muted-foreground font-body mb-2">Will be notified</p>
            <div className="space-y-2">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2.5 bg-card rounded-xl border border-border">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-heading font-bold text-primary-foreground" style={{ backgroundColor: c.color }}>
                    {c.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-body font-semibold text-foreground">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground font-body">{c.rel}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={startJourney}
            className="w-full py-3.5 bg-teal text-accent-foreground font-heading font-bold text-lg rounded-xl hover:brightness-110 active:scale-[0.98] transition-all">
            🧭 Start Journey
          </button>
        </div>
      ) : (
        <div className="px-4 animate-fade-in">
          <div className="p-5 bg-card rounded-2xl border border-teal/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-teal" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-teal animate-pulse-dot" />
              </div>
              <h2 className="font-heading font-bold text-teal">Journey Active</h2>
            </div>
            <div className="space-y-2 text-sm font-body">
              <p className="text-muted-foreground">From: <span className="text-foreground">{journey.from}</span></p>
              <p className="text-muted-foreground">To: <span className="text-foreground">{journey.to}</span></p>
              <p className="text-muted-foreground">Mode: <span className="text-foreground">{journey.mode}</span></p>
              <p className="text-muted-foreground">ETA: <span className="text-foreground">{journey.expectedArrival}</span></p>
            </div>
            <div className="text-center py-3">
              <p className="text-3xl font-heading font-extrabold text-foreground font-mono">{formatTime(elapsed)}</p>
              <p className="text-xs text-muted-foreground font-body mt-1">Time elapsed</p>
            </div>
            <button onClick={arrivedSafely}
              className="w-full py-3.5 bg-teal text-accent-foreground font-heading font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all">
              ✅ I Arrived Safely
            </button>
          </div>
          <p className="text-xs text-center text-muted-foreground font-body mt-4">
            If you don't confirm arrival by {journey.expectedArrival}, your contacts will be auto-alerted.
          </p>
        </div>
      )}
    </div>
  );
}

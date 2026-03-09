import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

interface MapPin {
  id: string;
  name: string;
  level: "danger" | "warning" | "safe";
  x: number;
  y: number;
  incidents: number;
  info: string;
}

const pins: MapPin[] = [
  { id: "1", name: "Anna Nagar", level: "danger", x: 30, y: 25, incidents: 12, info: "High risk area. 12 incidents this week." },
  { id: "2", name: "Vadapalani", level: "warning", x: 55, y: 45, incidents: 5, info: "Moderate risk. Poor lighting reported." },
  { id: "3", name: "T. Nagar", level: "safe", x: 45, y: 65, incidents: 1, info: "Safe zone. Active patrol present." },
  { id: "4", name: "Adyar", level: "safe", x: 70, y: 80, incidents: 0, info: "Safe zone. Well-lit streets." },
];

const levelConfig = {
  danger: { color: "bg-primary", glow: "shadow-[0_0_30px_hsl(var(--coral)/0.5)]", label: "High Risk", chip: "bg-primary/20 text-primary border-primary/30" },
  warning: { color: "bg-yellow", glow: "shadow-[0_0_30px_hsl(var(--yellow)/0.5)]", label: "Moderate", chip: "bg-yellow/20 text-yellow border-yellow/30" },
  safe: { color: "bg-teal", glow: "shadow-[0_0_30px_hsl(var(--teal)/0.5)]", label: "Safe", chip: "bg-teal/20 text-teal border-teal/30" },
};

export default function SafetyMapScreen() {
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const navigate = useNavigate();

  return (
    <div className="app-container pb-24 relative">
      {/* Header */}
      <div className="p-4 pt-6">
        <h1 className="text-xl font-heading font-extrabold text-foreground">Safety Map</h1>
        <p className="text-sm text-muted-foreground font-body">Real-time safety heatmap</p>
      </div>

      {/* Map */}
      <div className="mx-4 relative rounded-2xl overflow-hidden bg-card border border-border" style={{ height: 380 }}>
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`h${i}`} className="absolute w-full border-t border-foreground/20" style={{ top: `${(i + 1) * 11}%` }} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`v${i}`} className="absolute h-full border-l border-foreground/20" style={{ left: `${(i + 1) * 15}%` }} />
          ))}
        </div>

        {/* Heat zones */}
        <div className="absolute rounded-full animate-breathe" style={{ left: "20%", top: "15%", width: 120, height: 120, background: "radial-gradient(circle, hsl(348 100% 62% / 0.3), transparent)" }} />
        <div className="absolute rounded-full animate-breathe" style={{ left: "45%", top: "35%", width: 100, height: 100, background: "radial-gradient(circle, hsl(43 100% 50% / 0.25), transparent)", animationDelay: "1s" }} />
        <div className="absolute rounded-full animate-breathe" style={{ left: "35%", top: "55%", width: 90, height: 90, background: "radial-gradient(circle, hsl(168 100% 42% / 0.25), transparent)", animationDelay: "0.5s" }} />
        <div className="absolute rounded-full animate-breathe" style={{ left: "60%", top: "70%", width: 100, height: 100, background: "radial-gradient(circle, hsl(168 100% 42% / 0.25), transparent)", animationDelay: "1.5s" }} />

        {/* Pins */}
        {pins.map((pin) => (
          <button
            key={pin.id}
            onClick={() => setSelectedPin(pin)}
            className={`absolute w-8 h-8 rounded-full ${levelConfig[pin.level].color} ${levelConfig[pin.level].glow} flex items-center justify-center text-xs font-heading font-bold text-background transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform z-10`}
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          >
            📍
          </button>
        ))}
      </div>

      {/* Bottom chips */}
      <div className="flex gap-2 px-4 mt-4 overflow-x-auto pb-2">
        {pins.map((pin) => (
          <button
            key={pin.id}
            onClick={() => setSelectedPin(pin)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full border text-xs font-body font-medium ${levelConfig[pin.level].chip}`}
          >
            {pin.name}
          </button>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate("/report")}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary rounded-full flex items-center justify-center text-xl shadow-lg shadow-primary/30 hover:brightness-110 active:scale-95 transition-all z-40 max-w-[390px]"
        style={{ right: "max(1rem, calc((100vw - 390px) / 2 + 1rem))" }}
      >
        📢
      </button>

      {/* Area Info Panel */}
      {selectedPin && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[370px] z-50 animate-slide-up">
          <div className="bg-card border border-border rounded-2xl p-4 mx-2.5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading font-bold text-foreground">{selectedPin.name}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-body font-semibold border ${levelConfig[selectedPin.level].chip}`}>
                {levelConfig[selectedPin.level].label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-body mb-2">{selectedPin.info}</p>
            <p className="text-xs text-muted-foreground font-body">{selectedPin.incidents} incidents reported</p>
            <button onClick={() => setSelectedPin(null)} className="mt-3 w-full py-2 bg-secondary rounded-lg text-sm font-body font-medium text-foreground">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

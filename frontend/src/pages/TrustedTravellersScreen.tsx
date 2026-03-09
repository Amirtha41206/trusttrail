import { useState } from "react";
import { useApp, TrustedTraveller } from "@/contexts/AppContext";
import BottomNav from "@/components/BottomNav";
import BottomSheet from "@/components/BottomSheet";

const filterTypes = ["All", "Auto", "Cab", "Homestay", "Safe Shop", "Medical"] as const;

export default function TrustedTravellersScreen() {
  const { travellers, setTravellers } = useApp();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [showAdd, setShowAdd] = useState(false);
  const [newT, setNewT] = useState({ name: "", type: "Auto", vehicleNumber: "", area: "" });
  const [bouncingId, setBouncingId] = useState<string | null>(null);

  const filtered = travellers.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.area.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || t.type === filter;
    return matchSearch && matchFilter;
  });

  const totalRecs = travellers.reduce((s, t) => s + t.recommendCount, 0);
  const verifiedPct = Math.round((travellers.filter((t) => t.verified).length / travellers.length) * 100);

  const recommend = (id: string) => {
    setTravellers(travellers.map((t) => (t.id === id ? { ...t, recommendCount: t.recommendCount + 1 } : t)));
    setBouncingId(id);
    setTimeout(() => setBouncingId(null), 300);
  };

  const addTraveller = () => {
    const t: TrustedTraveller = {
      id: Date.now().toString(),
      name: newT.name,
      type: newT.type as TrustedTraveller["type"],
      vehicleNumber: newT.vehicleNumber || "-",
      area: newT.area,
      recommendCount: 0,
      verified: false,
      emoji: newT.type === "Auto" ? "🛺" : newT.type === "Cab" ? "🚕" : newT.type === "Homestay" ? "🏠" : newT.type === "Medical" ? "🏥" : "🏪",
    };
    setTravellers([t, ...travellers]);
    setShowAdd(false);
    setNewT({ name: "", type: "Auto", vehicleNumber: "", area: "" });
  };

  const typeBadgeColor: Record<string, string> = {
    Auto: "bg-yellow/20 text-yellow",
    Cab: "bg-blue/20 text-blue",
    Homestay: "bg-teal/20 text-teal",
    "Safe Shop": "bg-primary/20 text-primary",
    Medical: "bg-primary/20 text-primary",
  };

  return (
    <div className="app-container pb-24">
      <div className="p-4 pt-6">
        <h1 className="text-xl font-heading font-extrabold text-foreground">Trusted Travellers</h1>
        <p className="text-sm text-muted-foreground font-body">Community-verified safe contacts</p>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <input
          type="text"
          placeholder="Search by name or area..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-4 mb-3 overflow-x-auto pb-1">
        {filterTypes.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-body font-medium border transition-all ${
              filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="mx-4 mb-4 p-3 bg-card rounded-xl border border-border flex justify-around">
        <div className="text-center">
          <p className="text-base font-heading font-bold text-foreground">{travellers.length}</p>
          <p className="text-[10px] text-muted-foreground font-body">Listings</p>
        </div>
        <div className="text-center">
          <p className="text-base font-heading font-bold text-foreground">{totalRecs.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground font-body">Recommendations</p>
        </div>
        <div className="text-center">
          <p className="text-base font-heading font-bold text-foreground">{verifiedPct}%</p>
          <p className="text-[10px] text-muted-foreground font-body">Verified</p>
        </div>
      </div>

      {/* Listings */}
      <div className="px-4 space-y-2.5">
        {filtered.map((t) => (
          <div key={t.id} className="p-3.5 bg-card rounded-xl border border-border flex items-center gap-3">
            <span className="text-3xl">{t.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-body font-semibold text-foreground truncate">{t.name}</p>
                {t.verified && <span className="text-[10px]">✅</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-semibold ${typeBadgeColor[t.type] || "bg-secondary text-foreground"}`}>
                  {t.type}
                </span>
                {t.vehicleNumber !== "-" && <span className="text-[10px] text-muted-foreground font-body font-mono">{t.vehicleNumber}</span>}
              </div>
              <p className="text-[10px] text-muted-foreground font-body mt-0.5">📍 {t.area}</p>
            </div>
            <button
              onClick={() => recommend(t.id)}
              className={`flex flex-col items-center px-3 py-1.5 bg-secondary rounded-lg hover:bg-primary/20 transition-all active:scale-95 ${
                bouncingId === t.id ? "animate-bounce-once" : ""
              }`}
            >
              <span className="text-lg">👍</span>
              <span className="text-[10px] font-body font-bold text-foreground">{t.recommendCount}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Add FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-teal rounded-full flex items-center justify-center text-2xl text-accent-foreground shadow-lg shadow-teal/30 hover:brightness-110 active:scale-95 transition-all z-40"
        style={{ right: "max(1rem, calc((100vw - 390px) / 2 + 1rem))" }}
      >
        +
      </button>

      {/* Add Sheet */}
      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="Add Listing">
        <div className="space-y-3">
          <input placeholder="Name" value={newT.name} onChange={(e) => setNewT({ ...newT, name: e.target.value })}
            className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <select value={newT.type} onChange={(e) => setNewT({ ...newT, type: e.target.value })}
            className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
            {filterTypes.filter(f => f !== "All").map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <input placeholder="Vehicle Number (optional)" value={newT.vehicleNumber} onChange={(e) => setNewT({ ...newT, vehicleNumber: e.target.value })}
            className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input placeholder="Area" value={newT.area} onChange={(e) => setNewT({ ...newT, area: e.target.value })}
            className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <button onClick={addTraveller}
            className="w-full py-3 bg-primary text-primary-foreground font-heading font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all">
            Add Listing
          </button>
        </div>
      </BottomSheet>

      <BottomNav />
    </div>
  );
}

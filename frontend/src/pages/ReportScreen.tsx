import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const incidentTypes = [
  { icon: "👁️", label: "Being Followed" },
  { icon: "🚫", label: "Harassment" },
  { icon: "🚗", label: "Unsafe Driver" },
  { icon: "⚠️", label: "Suspicious" },
];

export default function ReportScreen() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "complaint" ? 1 : 0;
  const [tab, setTab] = useState(initialTab);
  const [selectedType, setSelectedType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Complaint tab
  const [cType, setCType] = useState("");
  const [cLocation, setCLocation] = useState("");
  const [cTime, setCTime] = useState("");
  const [generating, setGenerating] = useState(false);
  const [complaint, setComplaint] = useState("");
  const [copied, setCopied] = useState(false);

  const submitReport = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  const generateComplaint = () => {
    setGenerating(true);
    setTimeout(() => {
      setComplaint(
        `To,\nThe Station House Officer,\n${cLocation} Police Station\n\nSub: Complaint regarding ${cType}\n\nRespected Sir/Madam,\n\nI, the undersigned, wish to bring to your notice an incident of ${cType.toLowerCase()} that occurred on ${cTime || "recently"} at ${cLocation || "the mentioned location"}.\n\nI request you to kindly take necessary action and ensure the safety of women in this area.\n\nThanking you,\n[Your Name]\n[Your Contact]`
      );
      setGenerating(false);
    }, 1500);
  };

  const copyComplaint = () => {
    navigator.clipboard.writeText(complaint);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="app-container pb-24">
      <div className="p-4 pt-6">
        <h1 className="text-xl font-heading font-extrabold text-foreground">Report & Complaint</h1>
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mb-4 bg-card rounded-xl border border-border p-1">
        {["Report Incident", "AI Complaint"].map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`flex-1 py-2 rounded-lg text-sm font-body font-semibold transition-all ${tab === i ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 ? (
        <div className="px-4 space-y-4 animate-fade-in">
          {/* Incident Types */}
          <div className="grid grid-cols-2 gap-2.5">
            {incidentTypes.map((t) => (
              <button key={t.label} onClick={() => setSelectedType(t.label)}
                className={`p-3 rounded-xl border text-center transition-all ${selectedType === t.label ? "bg-primary/20 border-primary/50 text-primary" : "bg-card border-border text-muted-foreground"}`}>
                <span className="text-2xl">{t.icon}</span>
                <p className="text-xs font-body font-medium mt-1">{t.label}</p>
              </button>
            ))}
          </div>
          <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <textarea placeholder="Describe the incident..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <div className="p-6 border-2 border-dashed border-border rounded-xl text-center">
            <p className="text-sm text-muted-foreground font-body">📎 Tap to upload evidence</p>
            <p className="text-[10px] text-muted-foreground font-body mt-1">Photo or video</p>
          </div>
          <button onClick={submitReport}
            className="w-full py-3 bg-primary text-primary-foreground font-heading font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all">
            {submitted ? "✅ Report Submitted" : "Submit Report"}
          </button>
        </div>
      ) : (
        <div className="px-4 space-y-4 animate-fade-in">
          <select value={cType} onChange={(e) => setCType(e.target.value)}
            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">Select incident type</option>
            <option value="Harassment">Harassment</option>
            <option value="Stalking">Stalking</option>
            <option value="Unsafe Transport">Unsafe Transport</option>
            <option value="Eve Teasing">Eve Teasing</option>
          </select>
          <input placeholder="Location" value={cLocation} onChange={(e) => setCLocation(e.target.value)}
            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input type="datetime-local" value={cTime} onChange={(e) => setCTime(e.target.value)}
            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <button onClick={generateComplaint} disabled={generating}
            className="w-full py-3 bg-primary text-primary-foreground font-heading font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Generating...
              </span>
            ) : "Generate Complaint"}
          </button>
          {complaint && (
            <div className="space-y-2">
              <div className="p-4 bg-card border border-border rounded-xl">
                <pre className="text-xs text-foreground font-body whitespace-pre-wrap">{complaint}</pre>
              </div>
              <button onClick={copyComplaint}
                className="w-full py-2.5 bg-teal text-accent-foreground font-body font-semibold rounded-xl hover:brightness-110 transition-all">
                {copied ? "✅ Copied!" : "📋 Copy Complaint"}
              </button>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}

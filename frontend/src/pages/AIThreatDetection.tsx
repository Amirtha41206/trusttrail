import { useState, useRef, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type ThreatLevel = "safe" | "low" | "moderate" | "high" | "critical";

interface ThreatAction {
  label: string;
  type: "sos" | "call" | "navigate" | "info";
  urgent: boolean;
}

interface ThreatResult {
  threatLevel: ThreatLevel;
  summary: string;
  reasons: string[];
  actions: ThreatAction[];
  safetyTip: string;
}

interface Props {
  onBack: () => void;
  onTriggerSOS: () => void;
}

// ── Threat level config ───────────────────────────────────────────────────────
const LEVELS: Record<ThreatLevel, { label: string; color: string; bg: string; bar: number }> = {
  safe:     { label: "SAFE",     color: "#00d9a3", bg: "rgba(0,217,163,0.10)",  bar: 10  },
  low:      { label: "LOW",      color: "#7ecfff", bg: "rgba(126,207,255,0.10)", bar: 30  },
  moderate: { label: "MODERATE", color: "#f5c518", bg: "rgba(245,197,24,0.10)",  bar: 55  },
  high:     { label: "HIGH",     color: "#ff7043", bg: "rgba(255,112,67,0.10)",  bar: 78  },
  critical: { label: "CRITICAL", color: "#ff2d55", bg: "rgba(255,45,85,0.12)",   bar: 100 },
};

// ── Simulated audio cues when mic is on ───────────────────────────────────────
const AUDIO_CUES = [
  "🎙️ Raised voices detected nearby",
  "🎙️ Footsteps following pattern identified",
  "🎙️ Ambient noise — crowd, moderate",
  "🎙️ Silence detected — isolated area",
  "🎙️ Vehicle engine idling close by",
];

// ── Claude API call ───────────────────────────────────────────────────────────
async function analyzeWithClaude(description: string, audioCues: string[]): Promise<ThreatResult> {
  const systemPrompt = `You are a women's personal safety AI assistant embedded in a safety app.
Analyze the user's described situation and audio cues, then respond ONLY with a valid JSON object — no extra text, no markdown fences.

JSON schema:
{
  "threatLevel": "safe" | "low" | "moderate" | "high" | "critical",
  "summary": "<1-2 sentence assessment>",
  "reasons": ["<reason 1>", "<reason 2>", "<reason 3>"],
  "actions": [
    { "label": "<action>", "type": "sos" | "call" | "navigate" | "info", "urgent": true | false }
  ],
  "safetyTip": "<one practical tip for right now>"
}

Be empathetic, specific, and practical. If the situation is ambiguous, lean toward caution.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: `Situation: "${description}"\nAudio cues: ${audioCues.length ? audioCues.join("; ") : "none"}`,
      }],
    }),
  });

  const data = await res.json();
  const raw  = data.content?.find((b: any) => b.type === "text")?.text ?? "{}";
  return JSON.parse(raw.replace(/```json|```/g, "").trim()) as ThreatResult;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AIThreatDetection({ onBack, onTriggerSOS }: Props) {
  const [description, setDescription] = useState("");
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<ThreatResult | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [micActive, setMicActive]     = useState(false);
  const [audioCues, setAudioCues]     = useState<string[]>([]);
  const [cueIdx, setCueIdx]           = useState(0);

  const micIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulated mic cues
  useEffect(() => {
    if (micActive) {
      micIntervalRef.current = setInterval(() => {
        setCueIdx((i) => {
          const next = (i + 1) % AUDIO_CUES.length;
          setAudioCues((prev) => [...prev, AUDIO_CUES[next]].slice(-4));
          return next;
        });
      }, 3000);
    } else {
      if (micIntervalRef.current) clearInterval(micIntervalRef.current);
      setAudioCues([]);
    }
    return () => { if (micIntervalRef.current) clearInterval(micIntervalRef.current); };
  }, [micActive]);

  const handleAnalyze = async () => {
    if (!description.trim()) { setError("Please describe your current situation."); return; }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await analyzeWithClaude(description, audioCues);
      setResult(res);
    } catch {
      setError("AI analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? (LEVELS[result.threatLevel] ?? LEVELS.safe) : LEVELS.safe;

  const actionIcon: Record<string, string> = { sos: "🚨", call: "📞", navigate: "🗺️", info: "💡" };

  return (
    <div className="app-container pb-24 min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes mic-breathe {
          0%,100% { opacity: 1;    transform: scale(1);    }
          50%     { opacity: 0.45; transform: scale(0.85); }
        }
        .fade-up       { animation: fade-up 0.4s ease both; }
        .shimmer-block {
          background: linear-gradient(90deg,
            rgba(255,255,255,0.04) 25%,
            rgba(255,255,255,0.09) 50%,
            rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 8px; height: 13px; margin-bottom: 8px;
        }
        .mic-breathe { animation: mic-breathe 1.4s ease-in-out infinite; }
        .action-row:hover { filter: brightness(1.15); transform: translateX(3px); }
        .action-row { transition: all 0.2s; }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-3 p-4 pt-6 border-b border-border">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-foreground"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-base font-heading font-extrabold text-foreground">🛡️ AI Threat Detection</h1>
          <p className="text-[11px] text-muted-foreground font-body">Powered by Claude AI</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
          <span className="text-[10px] text-teal font-heading font-bold">ACTIVE</span>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* Situation input */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[11px] font-heading font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Describe Your Situation
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. I'm walking alone at night, a man has been following me for 2 blocks near a dark park..."
            rows={4}
            className="w-full bg-background border border-border rounded-lg p-3 text-sm font-body text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 transition-colors leading-relaxed"
          />
          <p className="text-[10px] text-muted-foreground font-body mt-1.5">
            Be specific — location, time, people nearby, what's happening.
          </p>
        </div>

        {/* Mic toggle */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-heading font-bold text-foreground">Audio Environment Scan</p>
            <p className="text-[11px] text-muted-foreground font-body mt-0.5">
              {micActive ? "Listening to surroundings..." : "Tap to enable mic analysis"}
            </p>
          </div>
          <button
            onClick={() => setMicActive((v) => !v)}
            className={`w-12 h-6 rounded-full relative transition-all ${micActive ? "bg-primary" : "bg-muted"}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${micActive ? "left-7" : "left-1"}`} />
          </button>
        </div>

        {/* Audio cues */}
        {audioCues.length > 0 && (
          <div className="space-y-1.5">
            {audioCues.map((c, i) => (
              <div
                key={i}
                className="fade-up px-3 py-2 rounded-lg text-xs font-body text-muted-foreground border border-primary/15 bg-primary/5"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {c}
              </div>
            ))}
          </div>
        )}

        {/* Analyse button */}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className={`w-full py-3.5 rounded-xl font-heading font-bold text-sm tracking-wide transition-all active:scale-[0.98] ${
            loading
              ? "bg-primary/30 text-primary-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:brightness-110"
          }`}
          style={{ boxShadow: loading ? "none" : "0 4px 20px rgba(255,45,85,0.35)" }}
        >
          {loading ? "⚡ ANALYSING..." : "⚡ ANALYSE THREAT"}
        </button>

        {error && (
          <p className="text-xs text-destructive font-body text-center">{error}</p>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="shimmer-block w-3/5" />
            <div className="shimmer-block w-full" />
            <div className="shimmer-block w-4/5" />
          </div>
        )}

        {/* ── Results ─────────────────────────────────────────────────────── */}
        {result && !loading && (
          <div className="space-y-3">

            {/* Threat level card */}
            <div
              className="fade-up rounded-xl p-4 border"
              style={{ background: cfg.bg, borderColor: cfg.color + "33" }}
            >
              {/* Bar */}
              <div className="mb-3">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] font-heading font-bold text-muted-foreground uppercase tracking-wider">Threat Level</span>
                  <span className="text-[11px] font-heading font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${cfg.bar}%`,
                      background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
                      boxShadow: `0 0 10px ${cfg.color}66`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  {(["safe","low","moderate","high","critical"] as ThreatLevel[]).map((l) => (
                    <span key={l} className="text-[9px] font-heading uppercase" style={{
                      color: l === result.threatLevel ? cfg.color : "hsl(var(--muted-foreground))",
                      fontWeight: l === result.threatLevel ? 700 : 400,
                    }}>{l}</span>
                  ))}
                </div>
              </div>
              <p className="text-sm font-body text-foreground leading-relaxed">{result.summary}</p>
            </div>

            {/* Risk factors */}
            {result.reasons?.length > 0 && (
              <div className="fade-up bg-card border border-border rounded-xl p-4" style={{ animationDelay: "0.1s" }}>
                <p className="text-[10px] font-heading font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Risk Factors Detected
                </p>
                {result.reasons.map((r, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-start">
                    <span style={{ color: cfg.color }} className="mt-0.5 text-xs">▸</span>
                    <span className="text-xs font-body text-foreground leading-relaxed">{r}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Recommended actions */}
            {result.actions?.length > 0 && (
              <div className="fade-up bg-card border border-border rounded-xl p-4" style={{ animationDelay: "0.15s" }}>
                <p className="text-[10px] font-heading font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Recommended Actions
                </p>
                {result.actions.map((a, i) => (
                  <button
                    key={i}
                    className="action-row w-full flex items-center gap-3 p-3 rounded-xl mb-2 border text-left"
                    style={{
                      background: a.urgent ? cfg.bg : "hsl(var(--background))",
                      borderColor: a.urgent ? cfg.color + "44" : "hsl(var(--border))",
                    }}
                    onClick={() => a.type === "sos" && onTriggerSOS()}
                  >
                    <span className="text-lg">{actionIcon[a.type] ?? "•"}</span>
                    <span
                      className="flex-1 text-sm font-body"
                      style={{ color: a.urgent ? cfg.color : "hsl(var(--foreground))", fontWeight: a.urgent ? 600 : 400 }}
                    >
                      {a.label}
                    </span>
                    {a.urgent && (
                      <span
                        className="text-[9px] font-heading font-bold px-2 py-0.5 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44` }}
                      >
                        URGENT
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Safety tip */}
            {result.safetyTip && (
              <div
                className="fade-up bg-card border rounded-xl p-4"
                style={{ borderColor: "rgba(126,207,255,0.2)", animationDelay: "0.2s" }}
              >
                <p className="text-[10px] font-heading font-bold text-blue uppercase tracking-wider mb-1.5">
                  💡 Safety Tip
                </p>
                <p className="text-xs font-body text-foreground leading-relaxed">{result.safetyTip}</p>
              </div>
            )}

            {/* Re-analyse */}
            <button
              onClick={handleAnalyze}
              className="w-full py-3 rounded-xl bg-card border border-border text-sm font-body text-muted-foreground hover:bg-secondary transition-colors"
            >
              🔄 Re-analyse situation
            </button>

          </div>
        )}
      </div>
    </div>
  );
}

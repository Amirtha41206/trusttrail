import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import BackButton from "@/components/BackButton";

const suggestions = ["MANGO", "PINEAPPLE", "HOMECOMING", "SUNFLOWER", "OKAYBYE"];

const initialMessages = [
  { text: "Da where are you?", fromMe: false, time: "6:42 PM" },
  { text: "On the way home, why?", fromMe: true, time: "6:43 PM" },
  { text: "Amma was asking. Eat anything?", fromMe: false, time: "6:43 PM" },
  { text: "Not yet will eat at home", fromMe: true, time: "6:44 PM" },
  { text: "Ok come fast it is getting dark", fromMe: false, time: "6:45 PM" },
];

export default function SafeWordScreen() {
  const { safeWord, setSafeWord, setSosActive } = useApp();
  const navigate = useNavigate();
  const [input, setInput] = useState(safeWord);
  const [saved, setSaved] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [chatInput, setChatInput] = useState("");
  const [triggered, setTriggered] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveSafeWord = () => {
    setSafeWord(input.toUpperCase());
    setSaved(true);
    setShowSettings(false);
    setTimeout(() => setSaved(false), 1500);
  };

  const now = () => {
    const d = new Date();
    return d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0") + " " + (d.getHours() >= 12 ? "PM" : "AM");
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setMessages((prev) => [...prev, { text: msg, fromMe: true, time: now() }]);
    setChatInput("");

    if (msg.toUpperCase().includes(safeWord.toUpperCase())) {
      setTriggered(true);
      setTimeout(() => {
        setTriggered(false);
        setSosActive(true);
        navigate("/sos-active");
      }, 2000);
      return;
    }

    const replies = ["Ok da", "Hmm", "Acha ok", "Got it!", "Fine fine", "Ok come soon"];
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: replies[Math.floor(Math.random() * replies.length)], fromMe: false, time: now() },
      ]);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0a0a0a" }}>

      {/* WhatsApp green header */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-white/10" style={{ backgroundColor: "#1f2c34" }}>
        <BackButton />
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-base" style={{ backgroundColor: "#25d366" }}>
          D
        </div>
        <div className="flex-1">
          <p className="text-sm font-heading font-bold text-white">Dad</p>
          <p className="text-[10px] font-body" style={{ color: "#25d366" }}>online</p>
        </div>
        <div className="flex gap-4 text-white/60 text-lg">
          <span>📞</span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-white/60 text-lg"
          >
            ⋮
          </button>
        </div>
      </div>

      {/* Settings dropdown - only shows when ⋮ is tapped */}
      {showSettings && (
        <div className="absolute right-4 top-16 z-50 rounded-xl shadow-xl border border-white/10 overflow-hidden" style={{ backgroundColor: "#1f2c34" }}>
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-xs text-white/50 font-body mb-2">Safe word: <span className="text-white font-bold">{safeWord}</span></p>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg text-white text-xs font-body focus:outline-none border border-white/10"
                style={{ backgroundColor: "#2a3942" }}
                placeholder="New safe word"
              />
              <button
                onClick={saveSafeWord}
                className="px-3 py-1.5 rounded-lg text-white text-xs font-body font-bold"
                style={{ backgroundColor: "#25d366", color: "#000" }}
              >
                {saved ? "Saved!" : "Save"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="px-2 py-0.5 rounded-full text-[10px] font-body border border-white/20 text-white/70"
                  style={{ backgroundColor: input === s ? "#25d36630" : "transparent" }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="w-full px-4 py-2 text-xs text-white/50 font-body text-left"
          >
            Close
          </button>
        </div>
      )}

      {/* Chat background */}
      <div
        className="flex-1 overflow-y-auto px-3 py-4 space-y-2"
        style={{ backgroundColor: "#0d1418" }}
      >
        <div className="flex justify-center mb-2">
          <span className="text-[10px] font-body px-3 py-1 rounded-full" style={{ backgroundColor: "#1f2c34", color: "#8696a0" }}>
            Today
          </span>
        </div>

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[75%] px-3 py-2 rounded-2xl text-xs font-body shadow-sm"
              style={{
                backgroundColor: m.fromMe ? "#005c4b" : "#1f2c34",
                color: "#e9edef",
                borderRadius: m.fromMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
              }}
            >
              <p>{m.text}</p>
              <p className="text-[9px] mt-1 text-right" style={{ color: "#8696a0" }}>
                {m.time} {m.fromMe && "✓✓"}
              </p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 px-3 py-3 border-t border-white/10" style={{ backgroundColor: "#1f2c34" }}>
        <span className="text-xl">😊</span>
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendChat()}
          placeholder="Message"
          className="flex-1 px-3 py-2 rounded-full text-xs font-body focus:outline-none border-none"
          style={{ backgroundColor: "#2a3942", color: "#e9edef" }}
        />
        <button
          onClick={sendChat}
          className="w-9 h-9 rounded-full flex items-center justify-center text-black font-bold"
          style={{ backgroundColor: "#25d366" }}
        >
          ➤
        </button>
      </div>

      {/* Silent SOS triggered */}
      {triggered && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="text-center p-6 rounded-2xl border border-white/10 mx-6" style={{ backgroundColor: "#1f2c34" }}>
            <p className="text-2xl mb-2">🚨</p>
            <p className="text-lg font-heading font-bold mb-1" style={{ color: "#25d366" }}>Silent SOS Triggered!</p>
            <p className="text-xs font-body" style={{ color: "#8696a0" }}>Alerting your emergency contacts silently...</p>
          </div>
        </div>
      )}

    </div>
  );
}
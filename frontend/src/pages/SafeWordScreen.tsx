import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import BackButton from "@/components/BackButton";

const suggestions = ["MANGO", "PINEAPPLE", "HOMECOMING", "SUNFLOWER", "OKAYBYE"];

export default function SafeWordScreen() {
  const { safeWord, setSafeWord, setSosActive } = useApp();
  const [input, setInput] = useState(safeWord);
  const [saved, setSaved] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ text: string; fromMe: boolean }[]>([
    { text: "Hey! How was your day?", fromMe: false },
    { text: "Pretty good! Just heading home 😊", fromMe: true },
    { text: "Nice! Stay safe out there", fromMe: false },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [triggered, setTriggered] = useState(false);

  const saveSafeWord = () => {
    setSafeWord(input.toUpperCase());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const newMsg = { text: chatInput, fromMe: true };
    setChatMessages([...chatMessages, newMsg]);

    if (chatInput.toUpperCase().includes(safeWord)) {
      setTriggered(true);
      setTimeout(() => {
        setSosActive(true);
        setTriggered(false);
      }, 2000);
    }
    setChatInput("");

    // Auto reply
    setTimeout(() => {
      setChatMessages((prev) => [...prev, { text: "Got it!", fromMe: false }]);
    }, 1000);
  };

  return (
    <div className="app-container min-h-screen pb-8">
      <div className="p-4 pt-6 flex items-center gap-3">
        <BackButton />
        <h1 className="text-xl font-heading font-extrabold text-foreground">Safe Word</h1>
      </div>

      <div className="px-4 space-y-5 animate-fade-in">
        {/* Current Safe Word */}
        <div className="text-center p-6 bg-card rounded-2xl border border-border">
          <p className="text-sm text-muted-foreground font-body mb-2">Your Safe Word</p>
          <p className="text-3xl font-mono font-extrabold text-primary tracking-widest">{safeWord}</p>
        </div>

        {/* Change Safe Word */}
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-card border border-border rounded-xl text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <button onClick={saveSafeWord}
            className="px-4 py-2.5 bg-primary text-primary-foreground font-body font-semibold rounded-xl hover:brightness-110 transition-all text-sm">
            {saved ? "✅" : "Save"}
          </button>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} onClick={() => setInput(s)}
              className={`px-3 py-1 rounded-full text-xs font-body font-medium border transition-all ${
                input === s ? "bg-primary/20 border-primary/50 text-primary" : "bg-card border-border text-muted-foreground"
              }`}>
              {s}
            </button>
          ))}
        </div>

        {/* Fake Chat */}
        <div>
          <p className="text-sm font-heading font-bold text-foreground mb-2">Fake Chat</p>
          <p className="text-[10px] text-muted-foreground font-body mb-3">Type your safe word here to trigger a silent SOS</p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs font-body ${
                    m.fromMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 p-2 border-t border-border">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-secondary rounded-lg text-foreground text-xs font-body placeholder:text-muted-foreground focus:outline-none" />
              <button onClick={sendChat} className="px-3 py-2 bg-primary rounded-lg text-primary-foreground text-xs font-body font-semibold">
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Triggered alert */}
        {triggered && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 max-w-[360px] w-full z-[100] animate-slide-down-toast">
            <div className="mx-4 p-3 bg-primary/20 border border-primary/30 rounded-xl text-center">
              <p className="text-sm font-heading font-bold text-primary">🚨 Silent SOS Triggered!</p>
              <p className="text-xs text-muted-foreground font-body mt-1">Alerting your emergency contacts...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

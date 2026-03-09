import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";

export default function LoginScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { setIsLoggedIn, setUser } = useApp();
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (isRegister && name) {
      setUser({ name, phone, avatar: "👩" });
    }
    setIsLoggedIn(true);
    navigate("/home");
  };

  return (
    <div className="app-container flex flex-col items-center justify-center min-h-screen px-8">
      {/* Logo */}
      <div className="mb-10 animate-fade-in text-center">
        <div className="text-6xl mb-4">🛡️</div>
        <h1 className="text-3xl font-heading font-extrabold text-foreground tracking-tight">
          Trust<span className="text-primary">Trail</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2 font-body">Your safety companion</p>
      </div>

      {/* Form */}
      <div className="w-full space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        {isRegister && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        )}
        <input
          type="tel"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-3.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />

        <button
          onClick={handleSubmit}
          className="w-full py-3.5 bg-primary text-primary-foreground font-heading font-bold text-lg rounded-xl hover:brightness-110 active:scale-[0.98] transition-all"
        >
          Continue →
        </button>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="w-full text-center text-sm text-muted-foreground font-body hover:text-foreground transition-colors"
        >
          {isRegister ? "Already have an account? Login" : "New here? Register"}
        </button>
      </div>
    </div>
  );
}

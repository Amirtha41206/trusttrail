import { useNavigate, useLocation } from "react-router-dom";

const tabs = [
  { path: "/home", icon: "🏠", label: "Home" },
  { path: "/map", icon: "🗺️", label: "Map" },
  { path: "/travellers", icon: "👥", label: "Travellers" },
  { path: "/report", icon: "📢", label: "Report" },
  { path: "/profile", icon: "👤", label: "Profile" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-card/95 backdrop-blur-xl border-t border-border z-50">
      <div className="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom,8px)]">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                active ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] font-body font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

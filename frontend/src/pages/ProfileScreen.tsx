import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import BottomNav from "@/components/BottomNav";
import BottomSheet from "@/components/BottomSheet";

export default function ProfileScreen() {
  const { user, setUser, contacts, setContacts, settings, setSettings, setIsLoggedIn } = useApp();
  const navigate = useNavigate();
  const [showAddContact, setShowAddContact] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [newContact, setNewContact] = useState({ name: "", phone: "", rel: "" });

  const colors = ["#FF3B6B", "#4A9EFF", "#00D4AA", "#FFB800"];

  const addContact = () => {
    const c = { id: Date.now().toString(), name: newContact.name, phone: newContact.phone, rel: newContact.rel, color: colors[contacts.length % colors.length] };
    setContacts([...contacts, c]);
    setShowAddContact(false);
    setNewContact({ name: "", phone: "", rel: "" });
  };

  const deleteContact = (id: string) => setContacts(contacts.filter((c) => c.id !== id));

  const saveProfile = () => {
    setUser({ ...user, name: editName });
    setEditing(false);
  };

  const sosSteps = [
    "📍 Your live location is captured",
    "📱 SMS alert sent to all emergency contacts",
    "📧 Email notification dispatched",
    "🗺️ Location shared via Google Maps link",
    "⏰ Continuous updates every 60 seconds",
  ];

  return (
    <div className="app-container pb-24">
      <div className="p-4 pt-6">
        <h1 className="text-xl font-heading font-extrabold text-foreground">Profile</h1>
      </div>

      {/* User Card */}
      <div className="mx-4 mb-5 p-4 bg-card rounded-2xl border border-border">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center text-3xl">
            {user.avatar}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="flex gap-2">
                <input value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-secondary border border-border rounded-lg text-foreground font-body text-sm focus:outline-none" />
                <button onClick={saveProfile} className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-body font-semibold rounded-lg">Save</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <p className="font-heading font-bold text-foreground">{user.name}</p>
                  <span className="text-xs">✅</span>
                </div>
                <p className="text-sm text-muted-foreground font-body">{user.phone}</p>
              </>
            )}
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="px-3 py-1.5 bg-secondary rounded-lg text-xs font-body font-medium text-foreground">Edit</button>
          )}
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="mx-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-heading font-bold text-foreground">Emergency Contacts</h2>
          <button onClick={() => setShowAddContact(true)} className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary text-lg">+</button>
        </div>
        <div className="space-y-2">
          {contacts.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-heading font-bold text-primary-foreground" style={{ backgroundColor: c.color }}>
                {c.name[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-body font-semibold text-foreground">{c.name}</p>
                  {i === 0 && <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[9px] font-body font-semibold rounded-full">Primary</span>}
                </div>
                <p className="text-[10px] text-muted-foreground font-body">{c.phone} · {c.rel}</p>
              </div>
              <button onClick={() => deleteContact(c.id)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors text-sm">✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* SOS Flow */}
      <div className="mx-4 mb-5 p-4 bg-card rounded-2xl border border-border">
        <h2 className="text-base font-heading font-bold text-foreground mb-3">What happens when you tap SOS</h2>
        <div className="space-y-2.5">
          {sosSteps.map((s, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-[10px] font-heading font-bold text-primary flex-shrink-0 mt-0.5">{i + 1}</div>
              <p className="text-xs font-body text-muted-foreground">{s}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2.5 bg-yellow/10 rounded-lg border border-yellow/20">
          <p className="text-[10px] font-body text-yellow">⚠️ TrustTrail alerts family. For police, call <b>100</b> or <b>1091</b>.</p>
        </div>
      </div>

      {/* Settings */}
      <div className="mx-4 mb-5">
        <h2 className="text-base font-heading font-bold text-foreground mb-3">Settings</h2>
        <div className="space-y-2">
          {[
            { key: "liveLocation" as const, label: "Live Location Sharing", icon: "📍" },
            { key: "shakeToSOS" as const, label: "Shake to SOS", icon: "📳" },
            { key: "areaAlerts" as const, label: "Area Alerts", icon: "🔔" },
          ].map((s) => (
            <div key={s.key} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
              <div className="flex items-center gap-2.5">
                <span>{s.icon}</span>
                <span className="text-sm font-body text-foreground">{s.label}</span>
              </div>
              <button onClick={() => setSettings({ ...settings, [s.key]: !settings[s.key] })}
                className={`w-11 h-6 rounded-full transition-all relative ${settings[s.key] ? "bg-teal" : "bg-border"}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-foreground rounded-full transition-all ${settings[s.key] ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <div className="px-4 mb-8">
        <button onClick={() => { setIsLoggedIn(false); navigate("/"); }}
          className="w-full py-3 bg-primary/10 border border-primary/20 text-primary font-heading font-bold rounded-xl hover:bg-primary/20 transition-all">
          Sign Out
        </button>
      </div>

      {/* Add Contact Sheet */}
      <BottomSheet open={showAddContact} onClose={() => setShowAddContact(false)} title="Add Contact">
        <div className="space-y-3">
          <input placeholder="Name" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
            className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input placeholder="Phone" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
            className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input placeholder="Relationship" value={newContact.rel} onChange={(e) => setNewContact({ ...newContact, rel: e.target.value })}
            className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <button onClick={addContact}
            className="w-full py-3 bg-primary text-primary-foreground font-heading font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all">
            Add Contact
          </button>
        </div>
      </BottomSheet>

      <BottomNav />
    </div>
  );
}

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  rel: string;
  color: string;
}

export interface TrustedTraveller {
  id: string;
  name: string;
  type: "Auto" | "Cab" | "Homestay" | "Safe Shop" | "Medical";
  vehicleNumber: string;
  area: string;
  recommendCount: number;
  verified: boolean;
  emoji: string;
}

export interface AreaAlert {
  id: string;
  area: string;
  level: "danger" | "warning" | "safe";
  message: string;
  time: string;
}

export interface Journey {
  from: string;
  to: string;
  mode: string;
  expectedArrival: string;
  active: boolean;
  startedAt?: number;
}

interface AppState {
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  user: { name: string; phone: string; avatar: string };
  setUser: (u: { name: string; phone: string; avatar: string }) => void;
  contacts: Contact[];
  setContacts: (c: Contact[]) => void;
  safeWord: string;
  setSafeWord: (s: string) => void;
  sosActive: boolean;
  setSosActive: (v: boolean) => void;
  journey: Journey | null;
  setJourney: (j: Journey | null) => void;
  travellers: TrustedTraveller[];
  setTravellers: (t: TrustedTraveller[]) => void;
  alerts: AreaAlert[];
  settings: { liveLocation: boolean; shakeToSOS: boolean; areaAlerts: boolean };
  setSettings: (s: { liveLocation: boolean; shakeToSOS: boolean; areaAlerts: boolean }) => void;
}

const AppContext = createContext<AppState | null>(null);

const defaultTravellers: TrustedTraveller[] = [
  { id: "1", name: "Ravi Kumar", type: "Auto", vehicleNumber: "TN 09 AB 1234", area: "Anna Nagar", recommendCount: 42, verified: true, emoji: "🚗" },
  { id: "2", name: "Priya Lakshmi", type: "Cab", vehicleNumber: "TN 09 CD 5678", area: "T. Nagar", recommendCount: 89, verified: true, emoji: "🚕" },
  { id: "3", name: "Meena's Homestay", type: "Homestay", vehicleNumber: "-", area: "Adyar", recommendCount: 156, verified: true, emoji: "🏠" },
  { id: "4", name: "Kumar Medicals", type: "Medical", vehicleNumber: "-", area: "Vadapalani", recommendCount: 67, verified: true, emoji: "🏥" },
  { id: "5", name: "Lakshmi Store", type: "Safe Shop", vehicleNumber: "-", area: "Mylapore", recommendCount: 34, verified: false, emoji: "🏪" },
  { id: "6", name: "Suresh Auto", type: "Auto", vehicleNumber: "TN 09 EF 9012", area: "Guindy", recommendCount: 28, verified: true, emoji: "🛺" },
];

const defaultAlerts: AreaAlert[] = [
  { id: "1", area: "Anna Nagar", level: "danger", message: "Multiple incidents reported near 2nd Avenue", time: "10 min ago" },
  { id: "2", area: "Vadapalani", level: "warning", message: "Poor street lighting reported", time: "25 min ago" },
  { id: "3", area: "Adyar", level: "safe", message: "Area marked safe by 12 users", time: "1 hr ago" },
];

const defaultContacts: Contact[] = [
  { id: "1", name: "Mom", phone: "+91 98765 43210", rel: "Mother", color: "#FF3B6B" },
  { id: "2", name: "Dad", phone: "+91 98765 43211", rel: "Father", color: "#4A9EFF" },
  { id: "3", name: "Priya", phone: "+91 98765 43212", rel: "Sister", color: "#00D4AA" },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "Ananya", phone: "+91 98765 43210", avatar: "👩" });
  const [contacts, setContacts] = useState<Contact[]>(defaultContacts);
  const [safeWord, setSafeWord] = useState("MANGO");
  const [sosActive, setSosActive] = useState(false);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [travellers, setTravellers] = useState<TrustedTraveller[]>(defaultTravellers);
  const [settings, setSettings] = useState({ liveLocation: true, shakeToSOS: false, areaAlerts: true });

  return (
    <AppContext.Provider value={{
      isLoggedIn, setIsLoggedIn,
      user, setUser,
      contacts, setContacts,
      safeWord, setSafeWord,
      sosActive, setSosActive,
      journey, setJourney,
      travellers, setTravellers,
      alerts: defaultAlerts,
      settings, setSettings,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

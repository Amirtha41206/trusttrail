import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import LoginScreen from "./pages/LoginScreen";
import HomeScreen from "./pages/HomeScreen";
import SafetyMapScreen from "./pages/SafetyMapScreen";
import TrustedTravellersScreen from "./pages/TrustedTravellersScreen";
import ReportScreen from "./pages/ReportScreen";
import JourneyModeScreen from "./pages/JourneyModeScreen";
import SafeWordScreen from "./pages/SafeWordScreen";
import ProfileScreen from "./pages/ProfileScreen";
import SOSActiveScreen from "./pages/SOSActiveScreen";
import AIThreatDetection from "./pages/AIThreatDetection";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper so AIThreatDetection gets navigation + SOS wired in
function AIThreatPage() {
  const navigate = useNavigate();
  const { setSosActive } = useApp();

  const handleBack = () => navigate(-1);

  const handleSOS = () => {
    setSosActive(true);
    navigate("/sos-active", { state: { reason: "AI Threat Detection triggered SOS" } });
  };

  return <AIThreatDetection onBack={handleBack} onTriggerSOS={handleSOS} />;
}

function AppRoutes() {
  const { isLoggedIn } = useApp();
  return (
    <Routes>
      <Route path="/"           element={isLoggedIn ? <Navigate to="/home" />        : <LoginScreen />}          />
      <Route path="/home"       element={isLoggedIn ? <HomeScreen />                 : <Navigate to="/" />}      />
      <Route path="/map"        element={isLoggedIn ? <SafetyMapScreen />            : <Navigate to="/" />}      />
      <Route path="/travellers" element={isLoggedIn ? <TrustedTravellersScreen />    : <Navigate to="/" />}      />
      <Route path="/report"     element={isLoggedIn ? <ReportScreen />               : <Navigate to="/" />}      />
      <Route path="/journey"    element={isLoggedIn ? <JourneyModeScreen />          : <Navigate to="/" />}      />
      <Route path="/safe-word"  element={isLoggedIn ? <SafeWordScreen />             : <Navigate to="/" />}      />
      <Route path="/profile"    element={isLoggedIn ? <ProfileScreen />              : <Navigate to="/" />}      />
      <Route path="/sos-active" element={isLoggedIn ? <SOSActiveScreen />            : <Navigate to="/" />}      />
      <Route path="/ai-threat"  element={isLoggedIn ? <AIThreatPage />              : <Navigate to="/" />}      />
      <Route path="*"           element={<NotFound />}                                                           />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

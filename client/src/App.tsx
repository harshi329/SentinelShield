import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

import Login      from "./pages/Login";
import Dashboard  from "./pages/Dashboard";
import Analyzer   from "./pages/Analyzer";
import ThreatLogs from "./pages/ThreatLogs";
import Analytics  from "./pages/Analytics";
import Settings   from "./pages/TempSettings";

// Redirect to /login if not authenticated
const Protected = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/"          element={<Protected><Dashboard /></Protected>} />
      <Route path="/analyzer"  element={<Protected><Analyzer /></Protected>} />
      <Route path="/logs"      element={<Protected><ThreatLogs /></Protected>} />
      <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
      <Route path="/settings"  element={<Protected><Settings /></Protected>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

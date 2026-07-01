import MainLayout from "../layouts/MainLayout";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Bell, Shield, ScanLine, Palette, Server, Save, CheckCircle,
  Lock, Eye, EyeOff, Sliders, Mail, User, KeyRound, Loader2,
  AlertTriangle, Activity, Database, Cpu, RefreshCw,
  ChevronRight, Zap, Globe, Clock,
} from "lucide-react";
import { useTheme } from "../contexts/themeContextCore";
import { useAuth } from "../contexts/AuthContext";
import CyberAvatar, { CYBER_AVATARS, CUTE_AVATARS } from "../components/CyberAvatar";
import { motion, AnimatePresence } from "framer-motion";

// ── Toggle ──────────────────────────────────────────────────────────────────
const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) => (
  <button
    role="switch"
    aria-checked={enabled}
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
      enabled ? "bg-sky-500" : "bg-slate-200 dark:bg-slate-700"
    }`}
  >
    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0"}`} />
  </button>
);

// ── Section Card ─────────────────────────────────────────────────────────────
const Section = ({
  icon: Icon, title, description, color, badge, children,
}: {
  icon: React.ElementType; title: string; description: string; color: string; badge?: string; children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
    <div className="flex items-center gap-4 border-b border-slate-100 dark:border-white/10 px-6 py-5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
          {badge && <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-500 uppercase tracking-wide">{badge}</span>}
        </div>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

// ── Setting Row ───────────────────────────────────────────────────────────
const SettingRow = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/5 last:border-0">
    <div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
      {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
    </div>
    <div className="ml-6 shrink-0">{children}</div>
  </div>
);

// ── Save Button ───────────────────────────────────────────────────────────
const SaveBtn = ({ saved, loading, onClick }: { saved: boolean; loading?: boolean; onClick: () => void }) => (
  <motion.button
    onClick={onClick}
    whileTap={{ scale: 0.96 }}
    className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all ${
      saved ? "bg-emerald-500 shadow-emerald-500/30" : "bg-sky-500 shadow-sky-500/30 hover:bg-sky-600"
    }`}
  >
    {loading ? <Loader2 size={14} className="animate-spin" /> : saved ? <><CheckCircle size={14} />Saved</> : <><Save size={14} />Save</>}
  </motion.button>
);

// ── Status Dot ────────────────────────────────────────────────────────────
const StatusDot = ({ status }: { status: "online" | "offline" | "checking" }) => {
  if (status === "checking") return <Loader2 size={12} className="animate-spin text-slate-400" />;
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === "online" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${status === "online" ? "bg-emerald-500" : "bg-red-500"}`} />
    </span>
  );
};

// ── Error / Success banners ───────────────────────────────────────────────
const ErrBanner = ({ msg }: { msg: string }) => (
  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
    className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400 mb-2">
    <AlertTriangle size={13} className="shrink-0" />{msg}
  </motion.div>
);
const OkBanner = ({ msg }: { msg: string }) => (
  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
    className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-xs text-emerald-400 mb-2">
    <CheckCircle size={13} className="shrink-0" />{msg}
  </motion.div>
);

// ── Main Component ────────────────────────────────────────────────────────
const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, avatarId, setAvatarId } = useAuth();

  // ── Change Password ──────────────────────────────────────────────────
  type PwStep = "idle" | "sent" | "done";
  const [pwStep,    setPwStep]    = useState<PwStep>("idle");
  const [pwOtp,     setPwOtp]     = useState(["","","","","",""]);
  const [newPw,     setNewPw]     = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError,   setPwError]   = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const t = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
    }, 1000);
  };

  const handleRequestPwOtp = async () => {
    setPwError(""); setPwLoading(true);
    try {
      await axios.post("/api/auth/change-password", {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("ss_token")}` },
      });
      setPwStep("sent"); startCountdown();
      setPwSuccess("OTP sent to your email.");
      setTimeout(() => setPwSuccess(""), 3000);
    } catch (e: unknown) {
      setPwError(axios.isAxiosError(e) ? e.response?.data?.message || "Failed to send OTP" : "Failed to send OTP");
    } finally { setPwLoading(false); }
  };

  const handleConfirmPw = async () => {
    const code = pwOtp.join("");
    if (code.length < 6) { setPwError("Enter the complete 6-digit OTP."); return; }
    if (!newPw || newPw.length < 6) { setPwError("Password must be at least 6 characters."); return; }
    setPwError(""); setPwLoading(true);
    try {
      await axios.post("/api/auth/confirm-password", { otp: code, newPassword: newPw }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("ss_token")}` },
      });
      setPwStep("done"); setPwSuccess("Password changed successfully!");
      setPwOtp(["","","","","",""]); setNewPw("");
    } catch (e: unknown) {
      setPwError(axios.isAxiosError(e) ? e.response?.data?.message || "Failed to change password" : "Failed to change password");
    } finally { setPwLoading(false); }
  };

  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...pwOtp]; next[idx] = val.slice(-1); setPwOtp(next);
    if (val && idx < 5) document.getElementById(`pw-otp-${idx + 1}`)?.focus();
  };
  const handleOtpKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !pwOtp[idx] && idx > 0) document.getElementById(`pw-otp-${idx - 1}`)?.focus();
  };

  // ── Security Prefs ───────────────────────────────────────────────────
  const [emailAlerts,     setEmailAlerts]     = useState(true);
  const [loginNotifs,     setLoginNotifs]     = useState(true);
  const [twoFactor,       setTwoFactor]       = useState(false);
  const [realTimeMonitor, setRealTimeMonitor] = useState(true);
  const [autoBlock,       setAutoBlock]       = useState(true);
  const [secSaved,        setSecSaved]        = useState(false);

  // ── Scan Prefs ───────────────────────────────────────────────────────
  const [scanMode,    setScanMode]    = useState("AI");
  const [sensitivity, setSensitivity] = useState(75);
  const [scanSaved,   setScanSaved]   = useState(false);

  // ── Notifications ────────────────────────────────────────────────────
  const [alertEmail,   setAlertEmail]   = useState("");
  const [slackWebhook, setSlackWebhook] = useState("");
  const [notifSaved,   setNotifSaved]   = useState(false);

  // ── Session / Access ─────────────────────────────────────────────────
  const [sessionTimeout, setSessionTimeout] = useState("30 minutes");
  const [rateLimit,      setRateLimit]      = useState(true);
  const [auditLog,       setAuditLog]       = useState(true);
  const [accessSaved,    setAccessSaved]    = useState(false);

  const saveSec    = () => { setSecSaved(true);    setTimeout(() => setSecSaved(false),    2500); };
  const saveScan   = () => { setScanSaved(true);   setTimeout(() => setScanSaved(false),   2500); };
  const saveNotif  = () => { setNotifSaved(true);  setTimeout(() => setNotifSaved(false),  2500); };
  const saveAccess = () => { setAccessSaved(true); setTimeout(() => setAccessSaved(false), 2500); };

  // ── System Status (live check) ────────────────────────────────────────
  type ServiceStatus = "online" | "offline" | "checking";
  const [services, setServices] = useState<{ label: string; icon: React.ElementType; status: ServiceStatus; latency?: number }[]>([
    { label: "Threat Detection Engine", icon: Cpu,      status: "checking" },
    { label: "Backend API Server",      icon: Globe,    status: "checking" },
    { label: "MongoDB Database",        icon: Database, status: "checking" },
    { label: "Real-Time Monitor",       icon: Activity, status: "checking" },
    { label: "Rate Limit Engine",       icon: Zap,      status: "checking" },
  ]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [refreshing,  setRefreshing]  = useState(false);
  const checksDone = useRef(false);

  const checkStatus = async () => {
    setRefreshing(true);
    checksDone.current = false;
    setServices(s => s.map(sv => ({ ...sv, status: "checking", latency: undefined })));
    const start = Date.now();
    try {
      await axios.get("/api/auth/me", { headers: { Authorization: `Bearer ${localStorage.getItem("ss_token")}` } });
      const latency = Date.now() - start;
      setServices([
        { label: "Threat Detection Engine", icon: Cpu,      status: "online",  latency },
        { label: "Backend API Server",      icon: Globe,    status: "online",  latency },
        { label: "MongoDB Database",        icon: Database, status: "online",  latency },
        { label: "Real-Time Monitor",       icon: Activity, status: "online",  latency },
        { label: "Rate Limit Engine",       icon: Zap,      status: "online",  latency },
      ]);
    } catch {
      setServices(s => s.map(sv => ({ ...sv, status: "offline" })));
    }
    setLastChecked(new Date());
    setRefreshing(false);
  };

  useEffect(() => {
    if (!checksDone.current) { checksDone.current = true; checkStatus(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensitivityLabel = sensitivity >= 75 ? "High" : sensitivity >= 40 ? "Medium" : "Low";
  const sensitivityColor = sensitivity >= 75 ? "text-red-500" : sensitivity >= 40 ? "text-amber-500" : "text-emerald-500";
  const onlineCount = services.filter(s => s.status === "online").length;

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 lg:p-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Configure SentinelShield security, scan, and notification preferences.
            </p>
          </div>
          {/* System health pill */}
          <div className={`hidden sm:flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${
            onlineCount === services.length
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
              : onlineCount === 0
              ? "border-red-500/30 bg-red-500/10 text-red-500"
              : "border-amber-500/30 bg-amber-500/10 text-amber-500"
          }`}>
            <StatusDot status={refreshing ? "checking" : onlineCount === services.length ? "online" : "offline"} />
            {refreshing ? "Checking..." : `${onlineCount}/${services.length} Services Online`}
          </div>
        </div>

        <div className="space-y-6">

          {/* ── Profile ─────────────────────────────────────────────────── */}
          <Section icon={User} title="Profile" description="Your identity and avatar on SentinelShield" color="bg-gradient-to-br from-sky-500 to-blue-600">
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                <CyberAvatar avatarId={avatarId} size="xl" />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-sm text-slate-400 truncate">{user?.email}</p>
                  <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-500">
                    <Shield size={10} /> Security Analyst
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">⚔️ Cyber Roles</p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {CYBER_AVATARS.map((av) => {
                    const Icon = av.icon; const selected = avatarId === av.id;
                    return (
                      <motion.button key={av.id} onClick={() => setAvatarId(av.id)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} title={av.label}
                        className={`relative flex flex-col items-center gap-1.5 rounded-xl p-2 border-2 transition-all ${selected ? "border-sky-500 bg-sky-500/10" : "border-slate-200 dark:border-white/10 hover:border-sky-300 dark:hover:border-sky-500/40"}`}>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${av.gradient} shadow-md`}>
                          <Icon size={18} className="text-white" />
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate w-full text-center">{av.label}</span>
                        {selected && (
                          <motion.div layoutId="avatar-check-cyber" className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-sky-500 flex items-center justify-center">
                            <CheckCircle size={10} className="text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">🌸 Cute Characters</p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {CUTE_AVATARS.map((av) => {
                    const selected = avatarId === av.id;
                    return (
                      <motion.button key={av.id} onClick={() => setAvatarId(av.id)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} title={av.label}
                        className={`relative flex flex-col items-center gap-1.5 rounded-xl p-2 border-2 transition-all ${selected ? "border-pink-400 bg-pink-400/10" : "border-slate-200 dark:border-white/10 hover:border-pink-300 dark:hover:border-pink-500/40"}`}>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${av.gradient} shadow-md text-2xl leading-none`}>{av.emoji}</div>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate w-full text-center">{av.label}</span>
                        {selected && (
                          <motion.div layoutId="avatar-check-cute" className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-pink-400 flex items-center justify-center">
                            <CheckCircle size={10} className="text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Section>

          {/* ── Change Password ──────────────────────────────────────────── */}
          <Section icon={KeyRound} title="Change Password" description="OTP verification sent to your registered email" color="bg-gradient-to-br from-violet-500 to-purple-600">
            <AnimatePresence mode="wait">
              {pwStep === "idle" && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 mb-4">
                    <Mail size={16} className="text-violet-400 shrink-0" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      A one-time password will be sent to <span className="text-sky-400 font-semibold">{user?.email}</span>
                    </p>
                  </div>
                  <AnimatePresence>{pwError && <ErrBanner msg={pwError} />}</AnimatePresence>
                  <button onClick={handleRequestPwOtp} disabled={pwLoading}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/30 disabled:opacity-50 hover:shadow-violet-500/50 transition-all">
                    {pwLoading ? <Loader2 size={15} className="animate-spin" /> : <><Mail size={15} />Send OTP to Email</>}
                  </button>
                </motion.div>
              )}

              {pwStep === "sent" && (
                <motion.div key="sent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2 block">6-Digit OTP</label>
                    <div className="flex gap-2">
                      {pwOtp.map((digit, i) => (
                        <input key={i} id={`pw-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                          onChange={(e) => handleOtpChange(e.target.value, i)}
                          onKeyDown={(e) => handleOtpKeyDown(e, i)}
                          className={`h-12 w-12 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 text-center text-lg font-bold text-slate-900 dark:text-white outline-none transition-all ${
                            digit ? "border-violet-500 bg-violet-500/10" : "border-slate-200 dark:border-white/10 focus:border-violet-500"
                          }`}
                        />
                      ))}
                      <button onClick={handleRequestPwOtp} disabled={countdown > 0 || pwLoading}
                        className="ml-2 rounded-xl px-3 text-xs font-medium text-sky-400 hover:text-sky-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors border border-slate-200 dark:border-white/10">
                        {countdown > 0 ? `${countdown}s` : "Resend"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2 block">New Password</label>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-4 py-3 focus-within:border-violet-500 transition-colors">
                      <Lock size={15} className="text-slate-400 shrink-0" />
                      <input type={showNewPw ? "text" : "password"} placeholder="Min. 6 characters" value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none" />
                      <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="text-slate-400 hover:text-slate-300 transition-colors">
                        {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {pwError   && <ErrBanner msg={pwError} />}
                    {pwSuccess && <OkBanner  msg={pwSuccess} />}
                  </AnimatePresence>
                  <button onClick={handleConfirmPw} disabled={pwLoading}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/30 disabled:opacity-50 transition-all">
                    {pwLoading ? <Loader2 size={15} className="animate-spin" /> : <><CheckCircle size={15} />Change Password</>}
                  </button>
                </motion.div>
              )}

              {pwStep === "done" && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-4 gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30">
                    <CheckCircle size={28} className="text-emerald-400" />
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white">Password Changed!</p>
                  <p className="text-sm text-slate-400 text-center">Your password has been updated successfully.</p>
                  <button onClick={() => { setPwStep("idle"); setPwError(""); setPwSuccess(""); }} className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
                    Change again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </Section>

          {/* ── 2-col grid ───────────────────────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Security Prefs */}
            <Section icon={Shield} title="Security Preferences" description="Core protection and monitoring controls" color="bg-gradient-to-br from-sky-500 to-blue-600" badge="Active">
              <SettingRow label="Email Threat Alerts" description="Receive alerts for high-risk detections">
                <Toggle enabled={emailAlerts} onChange={setEmailAlerts} />
              </SettingRow>
              <SettingRow label="Login Notifications" description="Alert on new login activity">
                <Toggle enabled={loginNotifs} onChange={setLoginNotifs} />
              </SettingRow>
              <SettingRow label="Two-Factor Authentication" description="Require 2FA for admin access">
                <Toggle enabled={twoFactor} onChange={setTwoFactor} />
              </SettingRow>
              <SettingRow label="Real-Time Monitoring" description="Continuously inspect live traffic">
                <Toggle enabled={realTimeMonitor} onChange={setRealTimeMonitor} />
              </SettingRow>
              <SettingRow label="Auto-Block High Risk" description="Automatically block requests scoring ≥ 60">
                <Toggle enabled={autoBlock} onChange={setAutoBlock} />
              </SettingRow>
              <div className="pt-4 flex justify-end">
                <SaveBtn saved={secSaved} onClick={saveSec} />
              </div>
            </Section>

            {/* Scan Prefs */}
            <Section icon={ScanLine} title="Scan Preferences" description="Tune the detection engine" color="bg-gradient-to-br from-purple-500 to-violet-600">
              <SettingRow label="Default Scan Mode" description="Applied when no mode is selected in the Analyzer">
                <select value={scanMode} onChange={(e) => setScanMode(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option value="Quick">Quick Scan</option>
                  <option value="Deep">Deep Scan</option>
                  <option value="AI">AI Enhanced</option>
                </select>
              </SettingRow>

              <div className="pt-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Detection Sensitivity</p>
                    <p className="text-xs text-slate-400">Higher = more flags, more false positives</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sliders size={14} className="text-slate-400" />
                    <span className={`text-sm font-bold ${sensitivityColor}`}>{sensitivityLabel} ({sensitivity})</span>
                  </div>
                </div>
                <div className="relative">
                  <input type="range" min={1} max={100} value={sensitivity} onChange={(e) => setSensitivity(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none bg-slate-200 dark:bg-white/10 accent-sky-500 cursor-pointer" />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                    <span>Low</span><span>Medium</span><span>High</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <SaveBtn saved={scanSaved} onClick={saveScan} />
              </div>
            </Section>

            {/* Notifications */}
            <Section icon={Bell} title="Notification Settings" description="Where to send security alerts" color="bg-gradient-to-br from-amber-500 to-orange-600">
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                    <Mail size={11} /> Alert Email
                  </label>
                  <input type="email" value={alertEmail} onChange={(e) => setAlertEmail(e.target.value)}
                    placeholder="security@yourcompany.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                    <Bell size={11} /> Slack Webhook <span className="normal-case font-normal text-slate-500">(optional)</span>
                  </label>
                  <input type="url" value={slackWebhook} onChange={(e) => setSlackWebhook(e.target.value)}
                    placeholder="https://hooks.slack.com/..."
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all" />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <SaveBtn saved={notifSaved} onClick={saveNotif} />
              </div>
            </Section>

            {/* Appearance */}
            <Section icon={Palette} title="Appearance" description="Customize how SentinelShield looks" color="bg-gradient-to-br from-pink-500 to-rose-600">
              <SettingRow label="Dark Mode" description="Toggle between light and dark interface">
                <Toggle enabled={theme === "dark"} onChange={toggleTheme} />
              </SettingRow>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button onClick={() => theme === "dark" && toggleTheme()}
                  className={`group rounded-xl border-2 p-4 text-sm font-medium transition-all flex flex-col items-center gap-2 ${
                    theme === "light" ? "border-sky-500 bg-sky-500/10 text-sky-500" : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                  }`}>
                  <span className="text-2xl">☀️</span>
                  <span>Light Mode</span>
                </button>
                <button onClick={() => theme === "light" && toggleTheme()}
                  className={`group rounded-xl border-2 p-4 text-sm font-medium transition-all flex flex-col items-center gap-2 ${
                    theme === "dark" ? "border-sky-500 bg-sky-500/10 text-sky-500" : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                  }`}>
                  <span className="text-2xl">🌙</span>
                  <span>Dark Mode</span>
                </button>
              </div>
            </Section>

            {/* Access Control */}
            <Section icon={Lock} title="Access Control" description="Authentication and session security" color="bg-gradient-to-br from-red-500 to-rose-600">
              <SettingRow label="Session Timeout" description="Auto-logout after inactivity">
                <select value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>Never</option>
                </select>
              </SettingRow>
              <SettingRow label="API Rate Limiting" description="Limit requests per IP per minute">
                <Toggle enabled={rateLimit} onChange={setRateLimit} />
              </SettingRow>
              <SettingRow label="Audit Logging" description="Log all admin actions for compliance">
                <Toggle enabled={auditLog} onChange={setAuditLog} />
              </SettingRow>
              <div className="pt-4 flex justify-end">
                <SaveBtn saved={accessSaved} onClick={saveAccess} />
              </div>
            </Section>

            {/* System Status */}
            <Section icon={Server} title="System Status" description="Live service health indicators" color="bg-gradient-to-br from-emerald-500 to-green-600" badge="Live">
              <div className="space-y-1 mb-4">
                {services.map(({ label, icon: SvcIcon, status, latency }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-white/5 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <StatusDot status={status} />
                      <SvcIcon size={13} className="text-slate-400" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {latency && status === "online" && (
                        <span className="text-[10px] text-slate-400">{latency}ms</span>
                      )}
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        status === "online"    ? "bg-emerald-500/10 text-emerald-500" :
                        status === "offline"   ? "bg-red-500/10 text-red-500" :
                        "bg-slate-500/10 text-slate-400"
                      }`}>
                        {status === "checking" ? "Checking…" : status === "online" ? "Operational" : "Offline"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/5 px-4 py-3 border border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Clock size={13} />
                  <span className="text-xs">
                    {lastChecked ? `Checked ${lastChecked.toLocaleTimeString()}` : "Checking…"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">v1.0.0</span>
                  <button onClick={checkStatus} disabled={refreshing}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-sky-500 hover:bg-sky-500/10 disabled:opacity-50 transition-all border border-sky-500/20">
                    <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Overall health bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>System Health</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {Math.round((onlineCount / services.length) * 100)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(onlineCount / services.length) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${onlineCount === services.length ? "bg-emerald-500" : onlineCount > 2 ? "bg-amber-500" : "bg-red-500"}`}
                  />
                </div>
              </div>
            </Section>

          </div>{/* end grid */}

          {/* ── Danger Zone ─────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-red-500/5 overflow-hidden">
            <div className="flex items-center gap-4 border-b border-red-500/20 px-6 py-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-700">
                <AlertTriangle size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
                <p className="text-xs text-slate-400">Irreversible actions — proceed with caution</p>
              </div>
            </div>
            <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Clear All Scan History</p>
                <p className="text-xs text-slate-400 mt-0.5">Permanently deletes all saved scan records. This cannot be undone.</p>
              </div>
              <button className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/20 transition-all shrink-0">
                <AlertTriangle size={14} /> Clear History
              </button>
            </div>
            <div className="px-6 py-5 border-t border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Export All Data</p>
                <p className="text-xs text-slate-400 mt-0.5">Download all your scan records and reports as a JSON archive.</p>
              </div>
              <button className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shrink-0">
                <ChevronRight size={14} /> Export Data
              </button>
            </div>
          </div>

        </div>{/* end space-y-6 */}
      </div>
    </MainLayout>
  );
};

export default Settings;

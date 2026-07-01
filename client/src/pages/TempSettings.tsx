import MainLayout from "../layouts/MainLayout";
import { useState } from "react";
import axios from "axios";
import {
  Bell, Shield, ScanLine, Palette, Server, Save, CheckCircle,
  Lock, Eye, Sliders, Mail, User, KeyRound, Loader2, AlertTriangle,
} from "lucide-react";
import { useTheme } from "../contexts/themeContextCore";
import { useAuth } from "../contexts/AuthContext";
import CyberAvatar, { CYBER_AVATARS, CUTE_AVATARS } from "../components/CyberAvatar";
import { motion, AnimatePresence } from "framer-motion";

// ── Reusable Toggle Switch ──────────────────────────────────────────────────
const Toggle = ({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    role="switch"
    aria-checked={enabled}
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
      enabled ? "bg-sky-500" : "bg-slate-200 dark:bg-slate-700"
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
        enabled ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

// ── Section Wrapper ─────────────────────────────────────────────────────────
const Section = ({
  icon: Icon,
  title,
  description,
  color,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
    <div className="flex items-center gap-4 border-b border-slate-100 dark:border-white/10 px-6 py-5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

// ── Setting Row ─────────────────────────────────────────────────────────────
const SettingRow = ({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/5 last:border-0">
    <div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
      {description && (
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      )}
    </div>
    <div className="ml-6 shrink-0">{children}</div>
  </div>
);

// ── Main Component ──────────────────────────────────────────────────────────
const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, avatarId, setAvatarId } = useAuth();

  const [saved, setSaved] = useState(false);

  // ── Change Password state ──────────────────────────────────────────────
  type PwStep = "idle" | "sent" | "done";
  const [pwStep,     setPwStep]     = useState<PwStep>("idle");
  const [pwOtp,      setPwOtp]      = useState(["","","","","",""]);
  const [newPw,      setNewPw]      = useState("");
  const [showNewPw,  setShowNewPw]  = useState(false);
  const [pwLoading,  setPwLoading]  = useState(false);
  const [pwError,    setPwError]    = useState("");
  const [pwSuccess,  setPwSuccess]  = useState("");
  const [countdown,  setCountdown]  = useState(0);

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
      setPwStep("sent");
      startCountdown();
      setPwSuccess("OTP sent to your email.");
      setTimeout(() => setPwSuccess(""), 3000);
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message : "Failed to send OTP";
      setPwError(msg || "Failed to send OTP");
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
      setPwStep("done");
      setPwSuccess("Password changed successfully!");
      setPwOtp(["","","","","",""]);
      setNewPw("");
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message : "Failed to change password";
      setPwError(msg || "Failed to change password");
    } finally { setPwLoading(false); }
  };

  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...pwOtp]; next[idx] = val.slice(-1); setPwOtp(next);
    if (val && idx < 5) document.getElementById(`pw-otp-${idx + 1}`)?.focus();
  };
  const handleOtpKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !pwOtp[idx] && idx > 0)
      document.getElementById(`pw-otp-${idx - 1}`)?.focus();
  };

  // Security
  const [emailAlerts,      setEmailAlerts]      = useState(true);
  const [loginNotifs,      setLoginNotifs]       = useState(true);
  const [twoFactor,        setTwoFactor]         = useState(false);
  const [realTimeMonitor,  setRealTimeMonitor]   = useState(true);
  const [autoBlock,        setAutoBlock]         = useState(true);

  // Scan
  const [scanMode,    setScanMode]    = useState("AI");
  const [sensitivity, setSensitivity] = useState(75);

  // Notifications
  const [alertEmail,   setAlertEmail]   = useState("");
  const [slackWebhook, setSlackWebhook] = useState("");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const sensitivityLabel = sensitivity >= 75 ? "High" : sensitivity >= 40 ? "Medium" : "Low";
  const sensitivityColor = sensitivity >= 75 ? "text-red-500" : sensitivity >= 40 ? "text-amber-500" : "text-emerald-500";

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Configure SentinelShield security, scan, and notification preferences.
            </p>
          </div>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all ${
              saved ? "bg-emerald-500 shadow-emerald-500/30" : "bg-sky-500 shadow-sky-500/30 hover:bg-sky-600"
            }`}
          >
            {saved ? <><CheckCircle size={15} />Saved</> : <><Save size={15} />Save Settings</>}
          </button>
        </div>

        <div className="mt-8 space-y-6">

          {/* ── Profile Section ──────────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-white/10 px-6 py-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600">
                <User size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">Profile</h2>
                <p className="text-xs text-slate-400">Your identity and avatar on SentinelShield</p>
              </div>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Current profile info */}
              <div className="flex items-center gap-4">
                <CyberAvatar avatarId={avatarId} size="xl" />
                <div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{user?.name}</p>
                  <p className="text-sm text-slate-400">{user?.email}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Email cannot be changed. Contact admin if needed.
                  </p>
                </div>
              </div>

              {/* Avatar picker */}
              <div className="space-y-4">
                {/* Cyber avatars */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">⚔️ Cyber Roles</p>
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                    {CYBER_AVATARS.map((av) => {
                      const Icon = av.icon;
                      const selected = avatarId === av.id;
                      return (
                        <motion.button
                          key={av.id}
                          onClick={() => setAvatarId(av.id)}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          title={av.label}
                          className={`relative flex flex-col items-center gap-1.5 rounded-xl p-2 border-2 transition-all ${
                            selected
                              ? "border-sky-500 bg-sky-500/10"
                              : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                          }`}
                        >
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${av.gradient} shadow-md`}>
                            <Icon size={18} className="text-white" />
                          </div>
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate w-full text-center">
                            {av.label}
                          </span>
                          {selected && (
                            <motion.div layoutId="avatar-check" className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-sky-500 flex items-center justify-center">
                              <CheckCircle size={10} className="text-white" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Cute avatars */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">🌸 Cute Characters</p>
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                    {CUTE_AVATARS.map((av) => {
                      const selected = avatarId === av.id;
                      return (
                        <motion.button
                          key={av.id}
                          onClick={() => setAvatarId(av.id)}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          title={av.label}
                          className={`relative flex flex-col items-center gap-1.5 rounded-xl p-2 border-2 transition-all ${
                            selected
                              ? "border-pink-400 bg-pink-400/10"
                              : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                          }`}
                        >
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${av.gradient} shadow-md text-2xl leading-none`}>
                            {av.emoji}
                          </div>
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate w-full text-center">
                            {av.label}
                          </span>
                          {selected && (
                            <motion.div layoutId="avatar-check" className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-pink-400 flex items-center justify-center">
                              <CheckCircle size={10} className="text-white" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Change Password Section ──────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-white/10 px-6 py-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                <KeyRound size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">Change Password</h2>
                <p className="text-xs text-slate-400">OTP will be sent to your registered email</p>
              </div>
            </div>

            <div className="px-6 py-5">
              <AnimatePresence mode="wait">

                {/* Step 1 — Request OTP */}
                {pwStep === "idle" && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      Click below to receive a one-time password at <span className="text-sky-400 font-medium">{user?.email}</span>.
                    </p>
                    <AnimatePresence>{pwError && <ErrBanner msg={pwError} />}</AnimatePresence>
                    <button
                      onClick={handleRequestPwOtp}
                      disabled={pwLoading}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/30 disabled:opacity-50 transition-all hover:shadow-violet-500/50"
                    >
                      {pwLoading ? <Loader2 size={15} className="animate-spin" /> : <><Mail size={15} />Send OTP to Email</>}
                    </button>
                  </motion.div>
                )}

                {/* Step 2 — Enter OTP + new password */}
                {pwStep === "sent" && (
                  <motion.div key="sent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Enter the OTP sent to <span className="text-sky-400 font-medium">{user?.email}</span> and your new password.
                    </p>

                    {/* OTP boxes */}
                    <div>
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">6-Digit OTP</label>
                      <div className="flex gap-2">
                        {pwOtp.map((digit, i) => (
                          <input
                            key={i}
                            id={`pw-otp-${i}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(e.target.value, i)}
                            onKeyDown={(e) => handleOtpKeyDown(e, i)}
                            className={`h-11 w-11 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 text-center text-base font-bold text-slate-900 dark:text-white outline-none transition-all ${
                              digit ? "border-violet-500 bg-violet-500/10" : "border-slate-200 dark:border-white/10 focus:border-violet-500"
                            }`}
                          />
                        ))}
                        <button
                          onClick={handleRequestPwOtp}
                          disabled={countdown > 0 || pwLoading}
                          className="ml-2 rounded-xl px-3 text-xs font-medium text-sky-400 hover:text-sky-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors border border-slate-200 dark:border-white/10"
                        >
                          {countdown > 0 ? `${countdown}s` : "Resend"}
                        </button>
                      </div>
                    </div>

                    {/* New password */}
                    <div>
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">New Password</label>
                      <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-4 py-3 focus-within:border-violet-500 transition-colors">
                        <Lock size={15} className="text-slate-400 shrink-0" />
                        <input
                          type={showNewPw ? "text" : "password"}
                          placeholder="Min. 6 characters"
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                          className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                        />
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="text-slate-400 hover:text-slate-200">
                          {showNewPw ? <Eye size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {pwError   && <ErrBanner msg={pwError} />}
                      {pwSuccess && <OkBanner  msg={pwSuccess} />}
                    </AnimatePresence>

                    <button
                      onClick={handleConfirmPw}
                      disabled={pwLoading}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/30 disabled:opacity-50 transition-all"
                    >
                      {pwLoading ? <Loader2 size={15} className="animate-spin" /> : <><CheckCircle size={15} />Change Password</>}
                    </button>
                  </motion.div>
                )}

                {/* Step 3 — Done */}
                {pwStep === "done" && (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-4 gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30">
                      <CheckCircle size={28} className="text-emerald-400" />
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-white">Password Changed!</p>
                    <p className="text-sm text-slate-400 text-center">Your password has been updated successfully.</p>
                    <button
                      onClick={() => { setPwStep("idle"); setPwError(""); setPwSuccess(""); }}
                      className="text-sm text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      Change again
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Rest of settings in grid ──────────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-2">

          {/* ── Security Preferences ─────────────────────────── */}
          <Section
            icon={Shield}
            title="Security Preferences"
            description="Control core protection and monitoring features"
            color="bg-gradient-to-br from-sky-500 to-blue-600"
          >
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
          </Section>

          {/* ── Scan Preferences ─────────────────────────────── */}
          <Section
            icon={ScanLine}
            title="Scan Preferences"
            description="Tune how the detection engine analyzes requests"
            color="bg-gradient-to-br from-purple-500 to-violet-600"
          >
            <SettingRow label="Default Scan Mode" description="Applied when no mode is selected in the Analyzer">
              <select
                value={scanMode}
                onChange={(e) => setScanMode(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Quick">Quick Scan</option>
                <option value="Deep">Deep Scan</option>
                <option value="AI">AI Enhanced</option>
              </select>
            </SettingRow>

            <div className="pt-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Detection Sensitivity
                  </p>
                  <p className="text-xs text-slate-400">Higher = more flags, more false positives</p>
                </div>
                <div className="flex items-center gap-2">
                  <Sliders size={14} className="text-slate-400" />
                  <span className={`text-sm font-semibold ${sensitivityColor}`}>
                    {sensitivityLabel} ({sensitivity})
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={1}
                max={100}
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-slate-200 dark:bg-white/10 accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
          </Section>

          {/* ── Notifications ────────────────────────────────── */}
          <Section
            icon={Bell}
            title="Notification Settings"
            description="Where to send security alerts"
            color="bg-gradient-to-br from-amber-500 to-orange-600"
          >
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  <Mail size={12} /> Alert Email Address
                </label>
                <input
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  placeholder="security@yourcompany.com"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  <Bell size={12} /> Slack Webhook URL (optional)
                </label>
                <input
                  type="url"
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  placeholder="https://hooks.slack.com/..."
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </Section>

          {/* ── Appearance ───────────────────────────────────── */}
          <Section
            icon={Palette}
            title="Appearance"
            description="Customize how SentinelShield looks"
            color="bg-gradient-to-br from-pink-500 to-rose-600"
          >
            <SettingRow label="Dark Mode" description="Toggle between light and dark interface">
              <Toggle enabled={theme === "dark"} onChange={toggleTheme} />
            </SettingRow>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => theme === "dark" && toggleTheme()}
                className={`rounded-xl border-2 p-3 text-sm font-medium transition-all ${
                  theme === "light"
                    ? "border-sky-500 bg-sky-500/10 text-sky-500"
                    : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                ☀️ Light Mode
              </button>
              <button
                onClick={() => theme === "light" && toggleTheme()}
                className={`rounded-xl border-2 p-3 text-sm font-medium transition-all ${
                  theme === "dark"
                    ? "border-sky-500 bg-sky-500/10 text-sky-500"
                    : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                🌙 Dark Mode
              </button>
            </div>
          </Section>

          {/* ── Access Control ───────────────────────────────── */}
          <Section
            icon={Lock}
            title="Access Control"
            description="Manage authentication and session security"
            color="bg-gradient-to-br from-red-500 to-rose-600"
          >
            <SettingRow label="Session Timeout" description="Auto-logout after inactivity">
              <select className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                <option>15 minutes</option>
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>Never</option>
              </select>
            </SettingRow>
            <SettingRow label="API Rate Limiting" description="Limit requests per IP per minute">
              <Toggle enabled={true} onChange={() => {}} />
            </SettingRow>
            <SettingRow label="Audit Logging" description="Log all admin actions for compliance">
              <Toggle enabled={true} onChange={() => {}} />
            </SettingRow>
          </Section>

          {/* ── System Status ────────────────────────────────── */}
          <Section
            icon={Server}
            title="System Status"
            description="Live service health indicators"
            color="bg-gradient-to-br from-emerald-500 to-green-600"
          >
            {[
              { label: "Threat Detection Engine", status: "Operational" },
              { label: "Backend API Server", status: "Operational" },
              { label: "MongoDB Database", status: "Operational" },
              { label: "Real-Time Monitor", status: "Operational" },
              { label: "Rate Limit Engine", status: "Operational" },
            ].map(({ label, status }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-white/5 last:border-0">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
                  {status}
                </span>
              </div>
            ))}

            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/5 px-4 py-3">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Eye size={14} />
                <span className="text-xs">Version</span>
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                SentinelShield v1.0.0
              </span>
            </div>
          </Section>

        </div>{/* end grid */}

        </div>{/* end space-y-6 */}

        {/* Bottom Save */}
        <div className="mt-8 flex items-center justify-end gap-4">
          <p className="text-xs text-slate-400">Changes are applied immediately after saving.</p>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white shadow-lg transition-all ${
              saved ? "bg-emerald-500 shadow-emerald-500/30" : "bg-sky-500 shadow-sky-500/30 hover:bg-sky-600 hover:shadow-sky-500/40"
            }`}
          >
            {saved ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> Save Settings</>}
          </button>
        </div>

      </div>
    </MainLayout>
  );
};

const ErrBanner = ({ msg }: { msg: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
    className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400 mb-2"
  >
    <AlertTriangle size={13} className="shrink-0" />{msg}
  </motion.div>
);

const OkBanner = ({ msg }: { msg: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
    className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-xs text-emerald-400 mb-2"
  >
    <CheckCircle size={13} className="shrink-0" />{msg}
  </motion.div>
);

export default Settings;

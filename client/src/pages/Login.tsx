import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import {
  Shield, Mail, Lock, User, Eye, EyeOff,
  ArrowRight, Loader2, AlertTriangle, CheckCircle2, KeyRound,
} from "lucide-react";

type Step = "auth" | "otp" | "forgot-email" | "forgot-otp" | "forgot-reset";
type Mode = "login" | "register";

const PARTICLES = Array.from({ length: 20 }, (_, i) => i);

const floatVariant = {
  animate: (i: number) => ({
    y: [0, -30, 0],
    x: [0, Math.sin(i) * 15, 0],
    opacity: [0.3, 0.7, 0.3],
    transition: { duration: 4 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 },
  }),
};

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [mode,         setMode]         = useState<Mode>("login");
  const [step,         setStep]         = useState<Step>("auth");
  const [name,         setName]         = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPass,     setShowPass]     = useState(false);
  const [showNewPass,  setShowNewPass]  = useState(false);
  const [otp,          setOtp]          = useState(["", "", "", "", "", ""]);
  const [userId,       setUserId]       = useState("");
  const [forgotEmail,  setForgotEmail]  = useState("");
  const [newPassword,  setNewPassword]  = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");
  const [countdown,    setCountdown]    = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const clearOtp = () => setOtp(["", "", "", "", "", ""]);

  // ── Login / Register ──────────────────────────────────────────────────────
  const handleAuth = async () => {
    setError(""); setSuccess("");
    if (!email || !password || (mode === "register" && !name)) {
      setError("Please fill in all fields."); return;
    }
    setLoading(true);
    try {
      const url     = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload = mode === "register" ? { name, email, password } : { email, password };
      const res     = await axios.post(url, payload);
      setUserId(res.data.userId);
      setCountdown(60);
      clearOtp();
      setStep("otp");
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message : "Something went wrong";
      setError(msg || "Something went wrong");
    } finally { setLoading(false); }
  };

  // ── OTP input helpers ─────────────────────────────────────────────────────
  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[idx] = val.slice(-1); setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };
  const handleOtpKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus();
  };

  // ── Verify OTP (login/register) ───────────────────────────────────────────
  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Enter the complete 6-digit OTP."); return; }
    setError(""); setLoading(true);
    try {
      const res = await axios.post("/api/auth/verify-otp", { userId, otp: code });
      login(res.data.token, res.data.user);
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => navigate("/"), 800);
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message : "Invalid OTP";
      setError(msg || "Invalid OTP");
      clearOtp();
      document.getElementById("otp-0")?.focus();
    } finally { setLoading(false); }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0) return;
    setError(""); setLoading(true);
    try {
      await axios.post("/api/auth/resend-otp", { userId });
      setCountdown(60);
      setSuccess("New OTP sent!"); setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Failed to resend OTP."); }
    finally { setLoading(false); }
  };

  // ── Forgot Password step 1 — request OTP ─────────────────────────────────
  const handleForgotRequest = async () => {
    setError(""); setSuccess("");
    if (!forgotEmail) { setError("Please enter your email."); return; }
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/forgot-password", { email: forgotEmail });
      setUserId(res.data.userId);
      setCountdown(60);
      clearOtp();
      setStep("forgot-otp");
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message : "Something went wrong";
      setError(msg || "Something went wrong");
    } finally { setLoading(false); }
  };

  // ── Forgot Password step 2 — verify OTP ──────────────────────────────────
  const handleForgotVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Enter the complete 6-digit OTP."); return; }
    setError(""); setLoading(true);
    try {
      // Just validate the OTP exists — move to reset step
      // We'll submit userId + otp + newPassword together in the last step
      setStep("forgot-reset");
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message : "Invalid OTP";
      setError(msg || "Invalid OTP");
      clearOtp();
    } finally { setLoading(false); }
  };

  // ── Forgot Password step 3 — reset password ───────────────────────────────
  const handleForgotReset = async () => {
    setError(""); setSuccess("");
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    const code = otp.join("");
    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", { userId, otp: code, newPassword });
      setSuccess("Password reset! Redirecting to login...");
      setTimeout(() => {
        setStep("auth"); setForgotEmail(""); setNewPassword(""); clearOtp(); setSuccess("");
      }, 2000);
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message : "Something went wrong";
      setError(msg || "Something went wrong");
    } finally { setLoading(false); }
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError(""); setSuccess(""); setName(""); setEmail(""); setPassword("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center p-4">

      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-950/60 via-slate-950 to-blue-950/60" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "linear-gradient(rgba(56,189,248,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating particles */}
      {PARTICLES.map((i) => (
        <motion.div
          key={i}
          custom={i}
          variants={floatVariant}
          animate="animate"
          className="absolute rounded-full bg-sky-400/20"
          style={{
            width:  `${4 + (i % 5) * 3}px`,
            height: `${4 + (i % 5) * 3}px`,
            left:   `${(i * 5.1) % 95}%`,
            top:    `${(i * 7.3) % 90}%`,
          }}
        />
      ))}

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-blue-500 to-violet-500" />

          <div className="p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/40 mb-4"
              >
                <Shield size={32} className="text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white">SentinelShield</h1>
              <p className="text-sm text-slate-400 mt-1">Advanced Security Platform</p>
            </div>

            <AnimatePresence mode="wait">

              {/* ── AUTH STEP ── */}
              {step === "auth" && (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  {/* Mode tabs */}
                  <div className="flex rounded-xl bg-slate-800/60 p-1 mb-6">
                    {(["login", "register"] as Mode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => { setMode(m); setError(""); }}
                        className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                          mode === m
                            ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {m === "login" ? "Sign In" : "Register"}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <AnimatePresence>
                      {mode === "register" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <InputField icon={<User size={16} />} type="text" placeholder="Full Name" value={name} onChange={setName} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <InputField icon={<Mail size={16} />} type="email" placeholder="Email Address" value={email} onChange={setEmail} />

                    <InputField
                      icon={<Lock size={16} />}
                      type={showPass ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={setPassword}
                      onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                      suffix={
                        <button type="button" onClick={() => setShowPass(!showPass)} className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />
                  </div>

                  {/* Forgot password link — only on login mode */}
                  {mode === "login" && (
                    <div className="mt-2 text-right">
                      <button
                        onClick={() => { setStep("forgot-email"); setForgotEmail(""); setError(""); setSuccess(""); }}
                        className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <AnimatePresence>{error && <ErrorBanner msg={error} />}</AnimatePresence>

                  <motion.button
                    onClick={handleAuth}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-all hover:shadow-sky-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : (
                      <>{mode === "login" ? "Sign In" : "Create Account"}<ArrowRight size={16} /></>
                    )}
                  </motion.button>

                  <p className="mt-5 text-center text-sm text-slate-400">
                    {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={switchMode} className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
                      {mode === "login" ? "Register" : "Sign In"}
                    </button>
                  </p>
                </motion.div>
              )}

              {/* ── OTP STEP (login/register) ── */}
              {step === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  <div className="text-center mb-6">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 mb-4"
                    >
                      <Mail size={26} className="text-emerald-400" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-white">Check Your Email</h2>
                    <p className="text-sm text-slate-400 mt-2">
                      We sent a 6-digit OTP to<br />
                      <span className="text-sky-400 font-medium">{email}</span>
                    </p>
                  </div>

                  <OtpBoxes otp={otp} onChange={handleOtpChange} onKeyDown={handleOtpKeyDown} />

                  <AnimatePresence>
                    {error   && <ErrorBanner msg={error} />}
                    {success && <SuccessBanner msg={success} />}
                  </AnimatePresence>

                  <motion.button
                    onClick={handleVerify}
                    disabled={loading || otp.join("").length < 6}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={16} /> Verify & Login</>}
                  </motion.button>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <button onClick={() => { setStep("auth"); clearOtp(); setError(""); }} className="text-slate-400 hover:text-slate-200 transition-colors">
                      ← Back
                    </button>
                    <button onClick={handleResend} disabled={countdown > 0 || loading} className="text-sky-400 hover:text-sky-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors">
                      {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── FORGOT PASSWORD — ENTER EMAIL ── */}
              {step === "forgot-email" && (
                <motion.div
                  key="forgot-email"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  <div className="text-center mb-6">
                    <motion.div
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-sky-500/20 border border-violet-500/30 mb-4"
                    >
                      <KeyRound size={26} className="text-violet-400" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-white">Forgot Password?</h2>
                    <p className="text-sm text-slate-400 mt-2">Enter your email and we'll send you an OTP to reset your password.</p>
                  </div>

                  <InputField
                    icon={<Mail size={16} />}
                    type="email"
                    placeholder="Email Address"
                    value={forgotEmail}
                    onChange={setForgotEmail}
                    onKeyDown={(e) => e.key === "Enter" && handleForgotRequest()}
                  />

                  <AnimatePresence>{error && <ErrorBanner msg={error} />}</AnimatePresence>

                  <motion.button
                    onClick={handleForgotRequest}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-sky-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><ArrowRight size={16} /> Send OTP</>}
                  </motion.button>

                  <div className="mt-4 text-center">
                    <button onClick={() => { setStep("auth"); setError(""); }} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
                      ← Back to Sign In
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── FORGOT PASSWORD — OTP VERIFY ── */}
              {step === "forgot-otp" && (
                <motion.div
                  key="forgot-otp"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  <div className="text-center mb-6">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-sky-500/20 border border-violet-500/30 mb-4"
                    >
                      <Mail size={26} className="text-violet-400" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-white">Enter OTP</h2>
                    <p className="text-sm text-slate-400 mt-2">
                      We sent a 6-digit OTP to<br />
                      <span className="text-sky-400 font-medium">{forgotEmail}</span>
                    </p>
                  </div>

                  <OtpBoxes otp={otp} onChange={handleOtpChange} onKeyDown={handleOtpKeyDown} />

                  <AnimatePresence>{error && <ErrorBanner msg={error} />}</AnimatePresence>

                  <motion.button
                    onClick={handleForgotVerify}
                    disabled={loading || otp.join("").length < 6}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-sky-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><ArrowRight size={16} /> Continue</>}
                  </motion.button>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <button onClick={() => { setStep("forgot-email"); clearOtp(); setError(""); }} className="text-slate-400 hover:text-slate-200 transition-colors">
                      ← Back
                    </button>
                    <button onClick={handleResend} disabled={countdown > 0 || loading} className="text-sky-400 hover:text-sky-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors">
                      {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── FORGOT PASSWORD — SET NEW PASSWORD ── */}
              {step === "forgot-reset" && (
                <motion.div
                  key="forgot-reset"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  <div className="text-center mb-6">
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-violet-500/20 border border-emerald-500/30 mb-4"
                    >
                      <Lock size={26} className="text-emerald-400" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-white">Set New Password</h2>
                    <p className="text-sm text-slate-400 mt-2">Choose a strong password for your account.</p>
                  </div>

                  <InputField
                    icon={<Lock size={16} />}
                    type={showNewPass ? "text" : "password"}
                    placeholder="New Password (min. 6 chars)"
                    value={newPassword}
                    onChange={setNewPassword}
                    onKeyDown={(e) => e.key === "Enter" && handleForgotReset()}
                    suffix={
                      <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />

                  <AnimatePresence>
                    {error   && <ErrorBanner msg={error} />}
                    {success && <SuccessBanner msg={success} />}
                  </AnimatePresence>

                  <motion.button
                    onClick={handleForgotReset}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-violet-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={16} /> Reset Password</>}
                  </motion.button>

                  <div className="mt-4 text-center">
                    <button onClick={() => { setStep("forgot-otp"); setError(""); }} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
                      ← Back
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const InputField = ({
  icon, type, placeholder, value, onChange, onKeyDown, suffix,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  suffix?: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 focus-within:border-sky-500 transition-colors">
    <span className="text-slate-400 shrink-0">{icon}</span>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-slate-500 outline-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
    />
    {suffix && <span className="shrink-0 ml-2">{suffix}</span>}
  </div>
);

const OtpBoxes = ({
  otp, onChange, onKeyDown,
}: {
  otp: string[];
  onChange: (val: string, idx: number) => void;
  onKeyDown: (e: React.KeyboardEvent, idx: number) => void;
}) => (
  <div className="flex gap-2 justify-center mb-6">
    {otp.map((digit, i) => (
      <motion.input
        key={i}
        id={`otp-${i}`}
        type="text"
        inputMode="numeric"
        maxLength={1}
        value={digit}
        onChange={(e) => onChange(e.target.value, i)}
        onKeyDown={(e) => onKeyDown(e, i)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.06 }}
        className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl border-2 bg-slate-800 text-center text-lg font-bold text-white outline-none transition-all ${
          digit
            ? "border-sky-500 bg-sky-500/10 shadow-md shadow-sky-500/20"
            : "border-slate-600 focus:border-sky-500"
        }`}
      />
    ))}
  </div>
);

const ErrorBanner = ({ msg }: { msg: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400"
  >
    <AlertTriangle size={13} className="shrink-0" />
    {msg}
  </motion.div>
);

const SuccessBanner = ({ msg }: { msg: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-xs text-emerald-400"
  >
    <CheckCircle2 size={13} className="shrink-0" />
    {msg}
  </motion.div>
);

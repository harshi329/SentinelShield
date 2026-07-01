import MainLayout from "../layouts/MainLayout";
import { useState } from "react";
import { createScan } from "../api/api";
import type { Scan, ScanMode } from "../types/scan";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Brain,
  ScanSearch,
  Info,
  Globe,
  Code2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MODES: {
  value: ScanMode;
  label: string;
  desc: string;
  icon: React.ElementType;
  gradient: string;
}[] = [
  { value: "Quick", label: "Quick", desc: "Fast pattern match", icon: Zap, gradient: "from-amber-500 to-orange-500" },
  { value: "Deep",  label: "Deep",  desc: "Full rule inspection", icon: ScanSearch, gradient: "from-sky-500 to-blue-600" },
  { value: "AI",    label: "AI",    desc: "Intelligent analysis", icon: Brain, gradient: "from-purple-500 to-violet-600" },
];

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"];

const SAMPLE_PAYLOADS: { label: string; url: string; body?: string; tag: string; tagColor: string }[] = [
  { label: "Safe request",        url: "https://example.com/products?id=10",                                        tag: "Safe",     tagColor: "text-emerald-500 bg-emerald-500/10" },
  { label: "SQL Injection",       url: "https://example.com/login?user=admin' OR '1'='1--",                         tag: "SQLi",     tagColor: "text-red-500 bg-red-500/10" },
  { label: "XSS",                 url: "https://example.com/search?q=<script>alert(1)</script>",                    tag: "XSS",      tagColor: "text-red-500 bg-red-500/10" },
  { label: "Directory Traversal", url: "https://example.com/download?file=../../etc/passwd",                        tag: "Traversal",tagColor: "text-red-500 bg-red-500/10" },
  { label: "Command Injection",   url: "https://example.com/ping?host=127.0.0.1; whoami",                           tag: "CMDi",     tagColor: "text-red-500 bg-red-500/10" },
  { label: "Scanner Path",        url: "https://example.com/.env",                                                  tag: "Recon",    tagColor: "text-amber-500 bg-amber-500/10" },
];

const CHECKS = [
  { key: "SQL Injection Signature",          label: "SQL Injection",         icon: "💉" },
  { key: "Cross-Site Scripting Signature",   label: "XSS",                   icon: "⚡" },
  { key: "Directory Traversal Signature",    label: "Directory Traversal",   icon: "📂" },
  { key: "Local File Inclusion Signature",   label: "File Inclusion (LFI)",  icon: "📄" },
  { key: "Command Injection Signature",      label: "Command Injection",     icon: "💻" },
  { key: "Encoded Payload Signature",        label: "Encoded Payloads",      icon: "🔐" },
  { key: "Suspicious Scanner Path",          label: "Scanner/Recon Paths",   icon: "🔍" },
  { key: "Rate Limit Threshold",             label: "Abusive Traffic Rate",  icon: "🚦" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const verdictConfig = (scan: Scan) => {
  if (scan.threatLevel === "Safe")
    return { icon: ShieldCheck, title: "Safe",         subtitle: "No threats detected — this request looks clean",     gradient: "from-emerald-500/15 to-green-500/5",   border: "border-emerald-500/40", iconColor: "text-emerald-500", pill: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" };
  if (scan.blocked || scan.threatLevel === "Blocked")
    return { icon: ShieldX,     title: "Blocked",      subtitle: "This request triggered a block decision",             gradient: "from-red-500/15 to-rose-500/5",         border: "border-red-500/40",     iconColor: "text-red-500",     pill: "bg-red-500/15 text-red-400 ring-red-500/30" };
  if (scan.threatLevel === "Malicious")
    return { icon: ShieldAlert,  title: "Malicious",   subtitle: "Dangerous attack signatures detected",               gradient: "from-red-500/15 to-rose-500/5",         border: "border-red-500/40",     iconColor: "text-red-500",     pill: "bg-red-500/15 text-red-400 ring-red-500/30" };
  if (scan.threatLevel === "Rate Limited")
    return { icon: ShieldAlert,  title: "Rate Limited","subtitle": "Too many requests from this IP",                   gradient: "from-purple-500/15 to-violet-500/5",    border: "border-purple-500/40",  iconColor: "text-purple-500",  pill: "bg-purple-500/15 text-purple-400 ring-purple-500/30" };
  return   { icon: Shield,       title: "Suspicious",  subtitle: "Unusual patterns detected — manual review advised",  gradient: "from-amber-500/15 to-orange-500/5",    border: "border-amber-500/40",   iconColor: "text-amber-500",   pill: "bg-amber-500/15 text-amber-400 ring-amber-500/30" };
};

const riskBar   = (s: number) => s >= 60 ? "bg-gradient-to-r from-red-500 to-rose-600"   : s >= 30 ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-emerald-500 to-green-500";
const riskLabel = (s: number) => s >= 60 ? "High Risk"   : s >= 30 ? "Medium Risk"  : "Low Risk";
const riskColor = (s: number) => s >= 60 ? "text-red-500" : s >= 30 ? "text-amber-500" : "text-emerald-500";

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const Analyzer = () => {
  const [url,         setUrl]         = useState("");
  const [method,      setMethod]      = useState("GET");
  const [scanMode,    setScanMode]    = useState<ScanMode>("AI");
  const [body,        setBody]        = useState("");
  const [showBody,    setShowBody]    = useState(false);
  const [result,      setResult]      = useState<Scan | null>(null);
  const [error,       setError]       = useState("");
  const [isLoading,   setIsLoading]   = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [scanCount,   setScanCount]   = useState(0);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setError("");
    setResult(null);
    setIsLoading(true);
    try {
      const scan = await createScan({ url: url.trim(), method, scanMode, body: body || undefined });
      setResult(scan);
      setScanCount((c) => c + 1);
    } catch {
      setError("Could not reach the server. Make sure the backend is running on port 5000.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = [
      `URL: ${result.url}`,
      `Method: ${result.method}`,
      `Verdict: ${result.threatLevel}`,
      `Risk Score: ${result.riskScore}/100`,
      `Attack Type: ${result.threatType}`,
      `Decision: ${result.blocked ? "Blocked" : "Allowed"}`,
      `Rules: ${result.detectionRules.join(", ") || "None"}`,
      `Recommendation: ${result.recommendation}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verdict = result ? verdictConfig(result) : null;

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 lg:p-8">

        {/* ── Page Header ─────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Request Analyzer
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Inspect HTTP requests for threats, injections, and malicious patterns
              </p>
            </div>
          </div>
          {scanCount > 0 && (
            <div className="hidden md:flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2">
              <ScanSearch size={14} className="text-sky-500" />
              <span className="text-xs font-medium text-sky-500">{scanCount} scan{scanCount !== 1 ? "s" : ""} this session</span>
            </div>
          )}
        </div>

        {/* ── Two-column layout ───────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* ══ LEFT — Request Builder ═══════════════════════ */}
          <div className="space-y-5">

            {/* Scan mode */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Scan Mode
              </p>
              <div className="grid grid-cols-3 gap-3">
                {MODES.map(({ value, label, desc, icon: Icon, gradient }) => (
                  <button
                    key={value}
                    onClick={() => setScanMode(value)}
                    className={`relative rounded-xl border-2 p-3 text-left transition-all duration-200 ${
                      scanMode === value
                        ? "border-sky-500 bg-sky-500/5 dark:bg-sky-500/10 shadow-sm shadow-sky-500/20"
                        : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                    }`}
                  >
                    <div className={`mb-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${gradient}`}>
                      <Icon size={13} className="text-white" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                    {scanMode === value && (
                      <div className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-sky-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Request input */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Request Details
              </p>

              {/* Method + URL */}
              <div className="flex gap-2">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-24 shrink-0 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {HTTP_METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>

                <div className={`flex flex-1 items-center gap-2 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 transition-all ${
                  error ? "border-red-400" : "border-slate-200 dark:border-white/10 focus-within:border-sky-500"
                }`}>
                  <Globe size={15} className="shrink-0 text-slate-400" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                    placeholder="https://example.com/path?param=value"
                    className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                  />
                  {url && (
                    <button onClick={() => { setUrl(""); setResult(null); setError(""); }}>
                      <XCircle size={15} className="text-slate-400 hover:text-slate-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Optional body */}
              <button
                onClick={() => setShowBody(!showBody)}
                className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <Code2 size={13} />
                Request Body (optional)
                {showBody ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showBody && (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={'{"key": "value"}  or  param=value&other=data'}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
              )}

              {error && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-xs text-red-500">
                  <AlertTriangle size={13} />
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={isLoading || !url.trim()}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition-all hover:shadow-sky-500/50 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                {isLoading ? (
                  <><Loader2 size={16} className="animate-spin" /> Analyzing Request...</>
                ) : (
                  <><Shield size={16} /> Run Security Scan</>
                )}
              </button>
            </div>

            {/* Sample payloads */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Test Payloads — click to load
              </p>
              <div className="space-y-2">
                {SAMPLE_PAYLOADS.map(({ label, url: sampleUrl, tag, tagColor }) => (
                  <button
                    key={label}
                    onClick={() => { setUrl(sampleUrl); setResult(null); setError(""); }}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-left transition-all hover:border-sky-500/30 hover:bg-sky-500/5"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tagColor}`}>
                      {tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* ══ RIGHT — Results ═══════════════════════════════ */}
          <div className="space-y-5">

            {/* Verdict card */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 py-20 shadow-sm">
                <Loader2 size={36} className="animate-spin text-sky-500 mb-4" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">Scanning request...</p>
                <p className="text-sm text-slate-400 mt-1">Running {scanMode} mode analysis</p>
              </div>
            ) : result && verdict ? (
              <div className={`rounded-2xl border-2 bg-gradient-to-br ${verdict.gradient} ${verdict.border} p-6 shadow-lg`}>

                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/70 dark:bg-white/10 shadow-sm">
                      <verdict.icon size={26} className={verdict.iconColor} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className={`text-xl font-bold ${verdict.iconColor}`}>{verdict.title}</h2>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${verdict.pill}`}>
                          {result.scanMode} Scan
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{verdict.subtitle}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCopy}
                    title="Copy result"
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    {copied ? <><Check size={12} className="text-emerald-500" /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>

                {/* Scanned URL */}
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/40 dark:bg-white/5 px-4 py-2.5">
                  <Globe size={13} className="shrink-0 text-slate-400" />
                  <span className="truncate font-mono text-xs text-slate-600 dark:text-slate-300">{result.url}</span>
                </div>

                {/* Risk Score */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Risk Score</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${riskColor(result.riskScore)}`}>{riskLabel(result.riskScore)}</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{result.riskScore} / 100</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/40 dark:bg-white/10">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-700 ${riskBar(result.riskScore)}`}
                      style={{ width: `${result.riskScore}%` }}
                    />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { label: "Attack Type",  value: result.threatType === "None" ? "None" : result.threatType },
                    { label: "Decision",     value: result.blocked ? "🚫 Blocked" : "✅ Allowed" },
                    { label: "Method",       value: result.method },
                    { label: "Domain",       value: result.domain || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl bg-white/50 dark:bg-white/5 p-3">
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white truncate">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Detection rules */}
                {result.detectionRules.length > 0 && (
                  <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-3">Rules Triggered</p>
                    <div className="flex flex-wrap gap-2">
                      {result.detectionRules.map((r) => (
                        <span key={r} className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-400 ring-1 ring-red-500/20">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evidence */}
                {result.evidence.length > 0 && (
                  <div className="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-500 mb-3">Evidence</p>
                    <ul className="space-y-1.5">
                      {result.evidence.map((e) => (
                        <li key={e} className="flex gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <span className="text-amber-500 shrink-0">•</span>
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendation */}
                <div className="mt-3 flex gap-3 rounded-xl bg-sky-500/10 border border-sky-500/20 p-4">
                  <Info size={14} className="shrink-0 text-sky-500 mt-0.5" />
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{result.recommendation}</p>
                </div>

                {/* Safe green banner */}
                {result.threatLevel === "Safe" && (
                  <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-3">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-500">Passed all {CHECKS.length} security checks</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 mb-4">
                  <Shield size={26} className="text-slate-400" />
                </div>
                <p className="font-semibold text-slate-600 dark:text-slate-400">No scan results yet</p>
                <p className="text-sm text-slate-400 mt-1">Enter a URL or load a test payload to begin</p>
              </div>
            )}

            {/* Investigation Checklist */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Investigation Checklist
              </p>
              <div className="space-y-2">
                {CHECKS.map(({ key, label, icon }) => {
                  const triggered = result?.detectionRules.includes(key) ?? false;
                  const scanned   = result !== null;
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                        triggered
                          ? "bg-red-500/10 border border-red-500/20"
                          : scanned
                          ? "bg-emerald-500/5 border border-emerald-500/15"
                          : "bg-slate-50 dark:bg-white/5 border border-transparent"
                      }`}
                    >
                      <span className="text-lg">{icon}</span>
                      <span className={`flex-1 text-sm font-medium ${
                        triggered ? "text-red-500" : scanned ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"
                      }`}>
                        {label}
                      </span>
                      {triggered ? (
                        <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-500">Detected</span>
                      ) : scanned ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : (
                        <span className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-white/20" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Analyzer;

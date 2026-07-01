import MainLayout from "../layouts/MainLayout";
import { Search, Download, FileText, Lock, Eye, EyeOff, X, Shield, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getScans, getScanSummary } from "../api/api";
import type { Scan, ScanSummary, ThreatLevel } from "../types/scan";

// ─── Threat badge styles ─────────────────────────────────────────────────────
const threatBadge: Record<ThreatLevel, string> = {
  Safe: "bg-green-500/10 text-green-500",
  Suspicious: "bg-amber-500/10 text-amber-500",
  Malicious: "bg-red-500/10 text-red-500",
  Blocked: "bg-red-600/10 text-red-600",
  "Rate Limited": "bg-purple-500/10 text-purple-500",
  Unknown: "bg-slate-500/10 text-slate-500",
};

// ─── CSV export (keep for fallback) ─────────────────────────────────────────
const exportCSV = (scans: Scan[]) => {
  if (scans.length === 0) return;
  const headers = ["Time","URL","Method","IP Address","Threat Type","Risk Score","Status","Blocked","Detection Rules","Recommendation"];
  const rows = scans.map((s) => [
    new Date(s.createdAt).toLocaleString(), s.url, s.method, s.ipAddress,
    s.threatType, String(s.riskScore), s.threatLevel, s.blocked ? "Yes" : "No",
    s.detectionRules.join(" | "), s.recommendation,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `sentinelshield-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
};

// ─── PDF export — calls server which generates AES-256 encrypted PDF ─────────
const generateEncryptedPDF = async (
  ownerPassword: string,
  userPassword: string,
): Promise<void> => {
  const response = await fetch("/api/report/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerPassword, userPassword }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: "Failed to generate PDF" }));
    throw new Error(err.message || "Failed to generate PDF");
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `sentinelshield-encrypted-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
};

// ─── Password Modal ───────────────────────────────────────────────────────────
const PasswordModal = ({
  onClose,
  onExport,
  count,
}: {
  onClose: () => void;
  onExport: (owner: string, user: string) => void;
  count: number;
}) => {
  const [ownerPwd, setOwnerPwd] = useState("");
  const [userPwd,  setUserPwd]  = useState("");
  const [showOwner, setShowOwner] = useState(false);
  const [showUser,  setShowUser]  = useState(false);
  const [error, setError] = useState("");

  const handleExport = () => {
    if (ownerPwd.length < 4) { setError("Your password must be at least 4 characters."); return; }
    if (userPwd.length < 4)  { setError("Recipient password must be at least 4 characters."); return; }
    if (ownerPwd === userPwd) { setError("Passwords must be different."); return; }
    setError("");
    onExport(ownerPwd, userPwd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50">

        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30">
              <Lock size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white">Encrypt PDF Report</h2>
              <p className="text-xs text-slate-400">{count} log{count !== 1 ? "s" : ""} · Password-protected export</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Info banner */}
          <div className="flex gap-3 rounded-xl bg-sky-500/10 border border-sky-500/20 p-4">
            <Shield size={16} className="shrink-0 text-sky-400 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed space-y-1">
              <p><span className="text-sky-400 font-semibold">Your password</span> — you keep this. Full owner control over the PDF.</p>
              <p><span className="text-emerald-400 font-semibold">Recipient password</span> — share this with whoever needs to open the PDF.</p>
              <p className="text-slate-500">Encrypted with 128-bit RC4. Copying and editing are disabled.</p>
            </div>
          </div>

          {/* Owner password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Your Password (Owner)
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800 px-4 py-3 focus-within:border-sky-500 transition-colors">
              <Lock size={14} className="shrink-0 text-slate-500" />
              <input
                type={showOwner ? "text" : "password"}
                value={ownerPwd}
                onChange={(e) => { setOwnerPwd(e.target.value); setError(""); }}
                placeholder="Min 4 characters"
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              />
              <button onClick={() => setShowOwner(!showOwner)} className="text-slate-500 hover:text-slate-300">
                {showOwner ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Recipient password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Recipient Password (To Open)
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800 px-4 py-3 focus-within:border-emerald-500 transition-colors">
              <Lock size={14} className="shrink-0 text-slate-500" />
              <input
                type={showUser ? "text" : "password"}
                value={userPwd}
                onChange={(e) => { setUserPwd(e.target.value); setError(""); }}
                placeholder="Share this with the recipient"
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              />
              <button onClick={() => setShowUser(!showUser)} className="text-slate-500 hover:text-slate-300">
                {showUser ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Strength indicators */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Your password", val: ownerPwd },
              { label: "Recipient password", val: userPwd },
            ].map(({ label, val }) => {
              const strength = val.length === 0 ? 0 : val.length < 4 ? 1 : val.length < 8 ? 2 : val.length < 12 ? 3 : 4;
              const colors   = ["bg-slate-700","bg-red-500","bg-amber-500","bg-sky-500","bg-emerald-500"];
              const labels   = ["","Weak","Fair","Strong","Very Strong"];
              return (
                <div key={label}>
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <div className="flex gap-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? colors[strength] : "bg-slate-700"}`} />
                    ))}
                  </div>
                  {val.length > 0 && <p className={`text-xs mt-1 ${colors[strength].replace("bg-","text-")}`}>{labels[strength]}</p>}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400">
              <AlertTriangle size={13} />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium text-slate-400 hover:text-white hover:border-white/20 transition-all">
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={!ownerPwd || !userPwd}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-all hover:shadow-sky-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={15} />
              Generate & Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ThreatLogs = () => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getScans().then(setScans).catch(() => setScans([]));
    getScanSummary().then(setSummary).catch(() => setSummary(null));
  }, []);

  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      const matchesSearch =
        scan.url.toLowerCase().includes(search.toLowerCase()) ||
        scan.threatType.toLowerCase().includes(search.toLowerCase()) ||
        scan.ipAddress.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "All" || scan.threatLevel === filter ||
        (filter === "Malicious" && ["Malicious","Blocked","Rate Limited"].includes(scan.threatLevel));
      return matchesSearch && matchesFilter;
    });
  }, [filter, scans, search]);

  const falsePositiveEstimate = useMemo(() =>
    scans.filter((s) => s.threatLevel !== "Safe" && s.threatLevel !== "Unknown" && s.riskScore < 20).length,
  [scans]);

  const handlePDFExport = async (ownerPwd: string, userPwd: string) => {
    setShowModal(false);
    setExporting(true);
    try {
      await generateEncryptedPDF(ownerPwd, userPwd);
    } catch (e) {
      console.error("PDF export failed:", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <MainLayout>
      {showModal && (
        <PasswordModal
          count={filteredScans.length}
          onClose={() => setShowModal(false)}
          onExport={handlePDFExport}
        />
      )}

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Threat Logs</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              View detected threats, scan history, and export encrypted reports.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportCSV(filteredScans)}
              disabled={filteredScans.length === 0}
              className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} />
              CSV
            </button>
            <button
              onClick={() => setShowModal(true)}
              disabled={filteredScans.length === 0 || exporting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition-all hover:shadow-sky-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Generating...</>
              ) : (
                <><FileText size={14} /><Lock size={12} />Export Encrypted PDF</>
              )}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-5">
          {[
            { label: "Blocked / High Risk", value: summary?.blockedScans || 0, border: "border-red-500/20", bg: "bg-red-500/5", color: "text-red-500" },
            { label: "Suspicious",          value: scans.filter((s) => s.threatLevel === "Suspicious").length, border: "border-orange-500/20", bg: "bg-orange-500/5", color: "text-orange-500" },
            { label: "Safe",                value: summary?.safeScans || 0, border: "border-green-500/20",  bg: "bg-green-500/5",  color: "text-green-500" },
            { label: "Est. False Positives",value: falsePositiveEstimate, border: "border-slate-200 dark:border-white/10", bg: "bg-white dark:bg-slate-900", color: "text-slate-700 dark:text-slate-200" },
          ].map(({ label, value, border, bg, color }) => (
            <div key={label} className={`rounded-2xl border ${border} ${bg} p-6 shadow-sm`}>
              <p className={`text-sm font-medium ${color}`}>{label}</p>
              <h2 className={`mt-3 text-4xl font-bold ${color}`}>{value}</h2>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="mt-6 flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by URL, threat type, or IP..."
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <select
            value={filter} onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {["All","Safe","Suspicious","Malicious","Blocked","Rate Limited"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>

        {/* Logs Table */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-4 text-left">Time</th>
                <th className="px-5 py-4 text-left">URL</th>
                <th className="px-5 py-4 text-left">IP Address</th>
                <th className="px-5 py-4 text-left">Threat Type</th>
                <th className="px-5 py-4 text-left">Risk</th>
                <th className="px-5 py-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredScans.length ? filteredScans.map((scan) => (
                <>
                  <tr key={scan._id} onClick={() => setExpanded(expanded === scan._id ? null : scan._id)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{new Date(scan.createdAt).toLocaleString()}</td>
                    <td className="max-w-[220px] truncate px-5 py-4 text-sm text-slate-900 dark:text-white">{scan.url}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">{scan.ipAddress}</td>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{scan.threatType}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                          <div className={`h-1.5 rounded-full ${scan.riskScore >= 60 ? "bg-red-500" : scan.riskScore >= 30 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${scan.riskScore}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{scan.riskScore}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${threatBadge[scan.threatLevel]}`}>{scan.threatLevel}</span>
                    </td>
                  </tr>
                  {expanded === scan._id && (
                    <tr key={`${scan._id}-detail`} className="bg-slate-50 dark:bg-white/5">
                      <td colSpan={6} className="px-5 py-5">
                        <div className="grid gap-5 md:grid-cols-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Rules Triggered</p>
                            {scan.detectionRules.length ? scan.detectionRules.map((r) => (
                              <p key={r} className="text-xs text-red-500 mb-1">• {r}</p>
                            )) : <p className="text-xs text-slate-400">None</p>}
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Evidence</p>
                            {scan.evidence.length ? scan.evidence.map((e) => (
                              <p key={e} className="text-xs text-slate-600 dark:text-slate-300 mb-1">• {e}</p>
                            )) : <p className="text-xs text-slate-400">No evidence</p>}
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Recommendation</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">{scan.recommendation || "—"}</p>
                            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Scan Mode</p>
                            <p className="text-xs text-sky-500 font-medium">{scan.scanMode}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )) : (
                <tr><td colSpan={6} className="py-16 text-center text-sm text-slate-400">No threat logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Report Summary */}
        {scans.length > 0 && (
          <div className="mt-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">Practical Report Summary</h2>
                <p className="text-xs text-slate-400 mt-0.5">Auto-generated for practical submission</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                disabled={filteredScans.length === 0}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-sky-500/20 hover:shadow-sky-500/40 transition-all disabled:opacity-40"
              >
                <Lock size={12} /> Export Encrypted PDF
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Attack Attempts", value: scans.length },
                { label: "Threats Detected", value: summary?.maliciousScans || 0 },
                { label: "False Positives (est.)", value: falsePositiveEstimate },
                { label: "Detection Accuracy", value: scans.length > 0 ? `${Math.round(((summary?.maliciousScans || 0) / scans.length) * 100)}%` : "0%" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-slate-50 dark:bg-white/5 p-4 text-center">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-sky-500/5 border border-sky-500/20 p-4">
              <p className="text-xs font-semibold text-sky-500 mb-2">Observed Attack Patterns</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary?.threatDistribution || {}).filter(([n]) => n !== "None").sort((a,b) => b[1]-a[1]).map(([name, count]) => (
                  <span key={name} className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-500">
                    {name}: {count}
                  </span>
                ))}
                {Object.keys(summary?.threatDistribution || {}).filter((n) => n !== "None").length === 0 && (
                  <span className="text-xs text-slate-400">No patterns recorded yet.</span>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
};

export default ThreatLogs;

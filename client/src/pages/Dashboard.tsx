import MainLayout from "../layouts/MainLayout";
import { useEffect, useState } from "react";
import { getScanSummary } from "../api/api";
import type { ScanSummary, ThreatLevel } from "../types/scan";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
  RefreshCw,
  Wifi,
  TrendingUp,
} from "lucide-react";

const threatBadge: Record<ThreatLevel, string> = {
  Safe: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  Suspicious: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
  Malicious: "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
  Blocked: "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30",
  "Rate Limited": "bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30",
  Unknown: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30",
};

const ATTACK_COLORS = [
  "from-sky-500 to-blue-600",
  "from-red-500 to-rose-600",
  "from-amber-500 to-orange-600",
  "from-purple-500 to-violet-600",
  "from-emerald-500 to-green-600",
];

const Dashboard = () => {
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const fetchData = () => {
    setSpinning(true);
    setLoading(true);
    getScanSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => {
        setLoading(false);
        setTimeout(() => setSpinning(false), 600);
      });
  };

  useEffect(() => { fetchData(); }, []);

  const topFlaggedIps = Object.entries(summary?.flaggedIps || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 5);

  const topThreats = Object.entries(summary?.threatDistribution || {})
    .filter(([name]) => name !== "None")
    .sort((a, b) => b[1] - a[1]).slice(0, 5);

  const detectionRate = summary && summary.totalScans > 0
    ? Math.round((summary.maliciousScans / summary.totalScans) * 100) : 0;

  const kpiCards = [
    {
      title: "URLs Scanned",
      value: summary?.totalScans || 0,
      sub: "Total requests inspected",
      icon: Activity,
      gradient: "from-sky-500 to-blue-600",
      glow: "shadow-sky-500/25",
    },
    {
      title: "Threats Detected",
      value: summary?.maliciousScans || 0,
      sub: `${detectionRate}% detection rate`,
      icon: AlertTriangle,
      gradient: "from-red-500 to-rose-600",
      glow: "shadow-red-500/25",
    },
    {
      title: "Safe URLs",
      value: summary?.safeScans || 0,
      sub: "Trusted requests allowed",
      icon: CheckCircle,
      gradient: "from-emerald-500 to-green-600",
      glow: "shadow-emerald-500/25",
    },
    {
      title: "Avg Risk Score",
      value: `${summary?.averageRisk || 0}%`,
      sub: "Platform-wide average",
      icon: TrendingUp,
      gradient: "from-amber-500 to-orange-600",
      glow: "shadow-amber-500/25",
    },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 lg:p-8">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Security Dashboard
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Real-time threat monitoring & analysis
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-emerald-500">Live</span>
            </div>

            <button
              onClick={fetchData}
              className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 shadow-sm hover:shadow-md transition-all"
            >
              <RefreshCw size={14} className={spinning ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {kpiCards.map(({ title, value, sub, icon: Icon, gradient, glow }) => (
            <div
              key={title}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 lg:p-6 shadow-xl ${glow}`}
            >
              {/* Background decoration */}
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute -right-2 -bottom-6 h-16 w-16 rounded-full bg-white/5" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white/80">{title}</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                    <Icon size={18} className="text-white" />
                  </div>
                </div>
                <p className="mt-2 text-2xl lg:text-4xl font-bold text-white">{value}</p>
                <p className="mt-1 text-xs text-white/70">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Middle Row */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">

          {/* Recent Scans Table */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 px-6 py-4">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">Recent Scan Activity</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Latest analyzed requests</p>
              </div>
              <Activity size={18} className="text-slate-400" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">URL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Verdict</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={4} className="px-6 py-4">
                          <div className="h-4 animate-pulse rounded-full bg-slate-100 dark:bg-white/10" />
                        </td>
                      </tr>
                    ))
                  ) : summary?.recentScans.length ? (
                    summary.recentScans.map((scan) => (
                      <tr key={scan._id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">
                          {new Date(scan.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="max-w-[120px] sm:max-w-[180px] truncate px-6 py-4 text-sm text-slate-800 dark:text-slate-200">
                          {scan.url}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${threatBadge[scan.threatLevel]}`}>
                            {scan.threatLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                              <div
                                className={`h-1.5 rounded-full ${scan.riskScore >= 60 ? "bg-red-500" : scan.riskScore >= 30 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${scan.riskScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{scan.riskScore}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-400">
                        No scans yet. Use the Analyzer to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Threat Feed */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 px-6 py-4">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">Live Threat Feed</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Active detections</p>
              </div>
              <Wifi size={18} className="text-red-400" />
            </div>

            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {summary?.recentScans.filter(
                (s) => s.threatLevel !== "Safe" && s.threatLevel !== "Unknown"
              ).length ? (
                summary.recentScans
                  .filter((s) => s.threatLevel !== "Safe" && s.threatLevel !== "Unknown")
                  .slice(0, 8)
                  .map((scan) => (
                    <div key={scan._id} className="rounded-xl bg-slate-50 dark:bg-white/5 p-3 border border-slate-100 dark:border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${threatBadge[scan.threatLevel]}`}>
                          {scan.threatLevel}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(scan.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-600 dark:text-slate-300 mt-1">{scan.url}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-400">{scan.threatType}</span>
                        <span className="text-xs font-semibold text-red-400">{scan.riskScore}/100</span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="flex h-52 flex-col items-center justify-center gap-2 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircle size={22} className="text-emerald-500" />
                  </div>
                  <p className="font-medium text-emerald-500">All Clear</p>
                  <p className="text-xs text-slate-400">No active threats detected</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">

          {/* Attack Distribution */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 dark:text-white">Attack Distribution</h2>
            <p className="text-xs text-slate-400 mt-0.5">By attack category</p>
            <div className="mt-5 space-y-4">
              {topThreats.length ? (
                topThreats.map(([name, count], i) => {
                  const total = topThreats.reduce((s, [, c]) => s + c, 0);
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={name}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{name}</span>
                        <span className="text-slate-400">{count} · {pct}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${ATTACK_COLORS[i % ATTACK_COLORS.length]} transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-400">No attack data yet.</p>
              )}
            </div>
          </div>

          {/* Flagged IPs */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 dark:text-white">Top Flagged IPs</h2>
            <p className="text-xs text-slate-400 mt-0.5">Most active threat sources</p>
            <div className="mt-5 space-y-3">
              {topFlaggedIps.length ? (
                topFlaggedIps.map(([ip, count], i) => (
                  <div key={ip} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-xs font-bold text-red-500">
                      {i + 1}
                    </div>
                    <span className="flex-1 font-mono text-sm text-slate-700 dark:text-slate-300 truncate">{ip}</span>
                    <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-500">
                      {count}×
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No flagged IPs yet.</p>
              )}
            </div>
          </div>

          {/* Security Score + Recommendations */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 dark:text-white">Security Posture</h2>
            <p className="text-xs text-slate-400 mt-0.5">Current system health</p>

            {/* Circular score */}
            <div className="mt-5 flex items-center justify-center">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/10 to-blue-600/10 border-4 border-sky-500/30">
                <div className="text-center">
                  <p className="text-3xl font-bold text-sky-500">
                    {100 - (summary?.averageRisk || 0)}
                  </p>
                  <p className="text-xs text-slate-400">/ 100</p>
                </div>
              </div>
            </div>
            <p className="mt-2 text-center text-sm font-medium text-slate-600 dark:text-slate-300">
              Security Score
            </p>

            <div className="mt-4 space-y-2">
              {[
                "Scan URLs before visiting sites",
                "Monitor logs for repeated attacks",
                "Block IPs over rate-limit threshold",
              ].map((rec) => (
                <p key={rec} className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="text-emerald-500 shrink-0">✓</span>
                  {rec}
                </p>
              ))}
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;

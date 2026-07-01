import MainLayout from "../layouts/MainLayout";
import { useEffect, useMemo, useState } from "react";
import { getScanSummary } from "../api/api";
import type { ScanSummary, ThreatLevel } from "../types/scan";

const threatBadge: Record<ThreatLevel, string> = {
  Safe: "bg-green-500/10 text-green-500",
  Suspicious: "bg-amber-500/10 text-amber-500",
  Malicious: "bg-red-500/10 text-red-500",
  Blocked: "bg-red-600/10 text-red-600",
  "Rate Limited": "bg-purple-500/10 text-purple-500",
  Unknown: "bg-slate-500/10 text-slate-500",
};

const ATTACK_COLORS = [
  "bg-sky-500",
  "bg-red-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-pink-500",
  "bg-indigo-500",
];

const Analytics = () => {
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScanSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  const allThreats = useMemo(() => {
    return Object.entries(summary?.threatDistribution || {}).sort(
      (a, b) => b[1] - a[1]
    );
  }, [summary]);

  const topFlaggedIps = useMemo(() => {
    return Object.entries(summary?.flaggedIps || {}).sort((a, b) => b[1] - a[1]);
  }, [summary]);

  const totalThreats = allThreats.reduce((s, [, c]) => s + c, 0);

  const detectionRate =
    summary && summary.totalScans > 0
      ? Math.round((summary.maliciousScans / summary.totalScans) * 100)
      : 0;

  const safeRate =
    summary && summary.totalScans > 0
      ? Math.round((summary.safeScans / summary.totalScans) * 100)
      : 0;

  return (
    <MainLayout>
      <div className="p-4 lg:p-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">
            Analytics
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Monitor security insights and threat intelligence trends.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-6">
            <p className="text-slate-500 dark:text-slate-400">URLs Scanned</p>
            <h2 className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">
              {summary?.totalScans || 0}
            </h2>
            <p className="mt-2 text-sm text-slate-500">Total scans performed</p>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-6">
            <p className="text-slate-500 dark:text-slate-400">Threats Detected</p>
            <h2 className="mt-3 text-4xl font-bold text-red-500">
              {summary?.maliciousScans || 0}
            </h2>
            <p className="mt-2 text-sm text-slate-500">Detection rate: {detectionRate}%</p>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-6">
            <p className="text-slate-500 dark:text-slate-400">Safe URLs</p>
            <h2 className="mt-3 text-4xl font-bold text-green-500">
              {summary?.safeScans || 0}
            </h2>
            <p className="mt-2 text-sm text-slate-500">Safe rate: {safeRate}%</p>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-6">
            <p className="text-slate-500 dark:text-slate-400">Avg Risk Score</p>
            <h2 className="mt-3 text-4xl font-bold text-amber-500">
              {summary?.averageRisk || 0}%
            </h2>
            <p className="mt-2 text-sm text-slate-500">Platform-wide average</p>
          </div>
        </div>

        {/* Detection Accuracy Overview */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          {/* Threat Distribution Bar Chart */}
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Attack Type Distribution
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Breakdown of detected attack categories.
            </p>

            <div className="mt-6 space-y-4">
              {loading ? (
                <p className="text-slate-400">Loading...</p>
              ) : allThreats.filter(([n]) => n !== "None").length ? (
                allThreats
                  .filter(([n]) => n !== "None")
                  .map(([name, count], i) => {
                    const pct =
                      totalThreats > 0
                        ? Math.round((count / totalThreats) * 100)
                        : 0;
                    return (
                      <div key={name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {name}
                          </span>
                          <span className="text-slate-500">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-white/10">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${ATTACK_COLORS[i % ATTACK_COLORS.length]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  No attack data available yet. Run some analyzer tests.
                </p>
              )}
            </div>
          </div>

          {/* Scan Outcome Breakdown */}
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Scan Outcome Breakdown
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              How requests were classified overall.
            </p>

            <div className="mt-6 space-y-4">
              {[
                {
                  label: "Safe",
                  value: summary?.safeScans || 0,
                  color: "bg-green-500",
                  textColor: "text-green-500",
                },
                {
                  label: "Malicious / Blocked",
                  value: summary?.maliciousScans || 0,
                  color: "bg-red-500",
                  textColor: "text-red-500",
                },
                {
                  label: "Suspicious",
                  value:
                    (summary?.totalScans || 0) -
                    (summary?.safeScans || 0) -
                    (summary?.maliciousScans || 0),
                  color: "bg-amber-500",
                  textColor: "text-amber-500",
                },
              ].map(({ label, value, color, textColor }) => {
                const total = summary?.totalScans || 1;
                const pct = Math.max(0, Math.round((value / total) * 100));
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={`font-medium ${textColor}`}>{label}</span>
                      <span className="text-slate-500">
                        {Math.max(0, value)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-white/10">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detection Accuracy Card */}
            <div className="mt-6 rounded-2xl bg-sky-500/10 p-4 text-center">
              <p className="text-sm text-sky-500 font-medium">
                Detection Accuracy
              </p>
              <p className="mt-1 text-3xl font-bold text-sky-500">
                {detectionRate}%
              </p>
              <p className="mt-1 text-xs text-slate-500">
                of all scans flagged as threats
              </p>
            </div>
          </div>
        </div>

        {/* Flagged IPs Table */}
        <div className="mt-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-6">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Flagged IP Addresses
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            IP addresses associated with malicious or suspicious activity.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="p-4 text-left">#</th>
                  <th className="p-4 text-left">IP Address</th>
                  <th className="p-4 text-left">Threat Hits</th>
                  <th className="p-4 text-left">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {topFlaggedIps.length ? (
                  topFlaggedIps.map(([ip, count], idx) => (
                    <tr
                      key={ip}
                      className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 text-slate-500 text-sm">{idx + 1}</td>
                      <td className="p-4 font-mono text-sm text-slate-900 dark:text-white">
                        {ip}
                      </td>
                      <td className="p-4 text-sm font-medium text-red-500">
                        {count}
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            count >= 5
                              ? "bg-red-500/10 text-red-500"
                              : count >= 3
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-sky-500/10 text-sky-500"
                          }`}
                        >
                          {count >= 5 ? "High" : count >= 3 ? "Medium" : "Low"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-10 text-center text-slate-500 dark:text-slate-400"
                    >
                      No flagged IPs detected yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Security Activity */}
        <div className="mt-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-6">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Recent Security Activity
          </h2>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="p-4 text-left">Time</th>
                  <th className="p-4 text-left">URL</th>
                  <th className="p-4 text-left">Threat Type</th>
                  <th className="p-4 text-left">Risk</th>
                  <th className="p-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary?.recentScans.length ? (
                  summary.recentScans.map((scan) => (
                    <tr
                      key={scan._id}
                      className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                        {new Date(scan.createdAt).toLocaleString()}
                      </td>
                      <td className="max-w-xs truncate p-4 text-sm text-slate-900 dark:text-white">
                        {scan.url}
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        {scan.threatType}
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">
                        {scan.riskScore}/100
                      </td>
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${threatBadge[scan.threatLevel]}`}>
                          {scan.threatLevel}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-500 dark:text-slate-400">
                      No security activity recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </MainLayout>
  );
};

export default Analytics;

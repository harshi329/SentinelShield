import Scan from "../models/Scan";
import { CreateScanDto } from "../types/scan";
import { analyzeRequest } from "./detectionEngine";

// ==========================================
// Create Scan
// ==========================================
export const createScanService = async (
  scanData: CreateScanDto
) => {
  const analysis = analyzeRequest(scanData);

  return await Scan.create({
    url: scanData.url,
    method: scanData.method || "GET",
    ipAddress: scanData.ipAddress || "unknown",
    requestBody: scanData.body || "",
    scanMode: scanData.scanMode || "AI",
    ...analysis,
  });
};

// ==========================================
// Get All Scans
// ==========================================
export const getAllScansService = async () => {
  return await Scan.find().sort({ createdAt: -1 }).lean();
};

// ==========================================
// Get Scan By ID
// ==========================================
export const getScanByIdService = async (id: string) => {
  return await Scan.findById(id).lean();
};

// ==========================================
// Delete Scan
// ==========================================
export const deleteScanService = async (id: string) => {
  return await Scan.findByIdAndDelete(id).lean();
};

// ==========================================
// Dashboard Summary
// ==========================================
export const getScanSummaryService = async () => {
  const scans = await Scan.find().sort({ createdAt: -1 }).lean();

  const totalScans = scans.length;
  const blockedScans = scans.filter(
    (scan) => scan.blocked
  ).length;
  const maliciousScans = scans.filter((scan) =>
    ["Malicious", "Blocked", "Rate Limited"].includes(
      scan.threatLevel
    )
  ).length;
  const safeScans = scans.filter(
    (scan) => scan.threatLevel === "Safe"
  ).length;

  const averageRisk =
    totalScans === 0
      ? 0
      : Math.round(
          scans.reduce(
            (sum, scan) => sum + scan.riskScore,
            0
          ) / totalScans
        );

  const threatDistribution = scans.reduce<
    Record<string, number>
  >((summary, scan) => {
    const key = scan.threatType || "None";
    summary[key] = (summary[key] || 0) + 1;
    return summary;
  }, {});

  const flaggedIps = scans.reduce<Record<string, number>>(
    (summary, scan) => {
      const key = scan.ipAddress || "unknown";
      if (scan.threatLevel !== "Safe") {
        summary[key] = (summary[key] || 0) + 1;
      }
      return summary;
    },
    {}
  );

  return {
    totalScans,
    blockedScans,
    maliciousScans,
    safeScans,
    averageRisk,
    threatDistribution,
    flaggedIps,
    recentScans: scans.slice(0, 8),
  };
};

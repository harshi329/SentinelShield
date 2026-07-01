export type ThreatLevel =
  | "Safe"
  | "Suspicious"
  | "Malicious"
  | "Blocked"
  | "Rate Limited"
  | "Unknown";

export type ScanMode = "Quick" | "Deep" | "AI";

export interface Scan {
  _id: string;
  url: string;
  method: string;
  ipAddress: string;
  requestBody: string;
  domain: string;
  threatLevel: ThreatLevel;
  threatType: string;
  riskScore: number;
  scanMode: ScanMode;
  blocked: boolean;
  detectionRules: string[];
  evidence: string[];
  recommendation: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScanPayload {
  url: string;
  method?: string;
  body?: string;
  scanMode?: ScanMode;
}

export interface ScanSummary {
  totalScans: number;
  blockedScans: number;
  maliciousScans: number;
  safeScans: number;
  averageRisk: number;
  threatDistribution: Record<string, number>;
  flaggedIps: Record<string, number>;
  recentScans: Scan[];
}

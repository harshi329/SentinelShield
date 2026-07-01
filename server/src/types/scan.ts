export type ThreatLevel =
  | "Safe"
  | "Suspicious"
  | "Malicious"
  | "Blocked"
  | "Rate Limited"
  | "Unknown";

export type ScanMode =
  | "Quick"
  | "Deep"
  | "AI";

export interface CreateScanDto {
  url: string;
  method?: string;
  ipAddress?: string;
  headers?: Record<string, string>;
  body?: string;
  domain?: string;
  threatLevel?: ThreatLevel;
  threatType?: string;
  riskScore?: number;
  scanMode?: ScanMode;
}

export interface ScanAnalysisResult {
  domain: string;
  threatLevel: ThreatLevel;
  threatType: string;
  riskScore: number;
  blocked: boolean;
  detectionRules: string[];
  evidence: string[];
  recommendation: string;
}

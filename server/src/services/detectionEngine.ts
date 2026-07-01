import { CreateScanDto, ScanAnalysisResult } from "../types/scan";

type DetectionRule = {
  name: string;
  type: string;
  severity: number;
  pattern: RegExp;
  evidence: string;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_THRESHOLD = 8;

const trafficTracker = new Map<
  string,
  { count: number; firstSeen: number }
>();

// Purge stale entries every minute to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of trafficTracker.entries()) {
    if (now - record.firstSeen > RATE_LIMIT_WINDOW_MS) {
      trafficTracker.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

const rules: DetectionRule[] = [
  {
    name: "SQL Injection Signature",
    type: "SQL Injection",
    severity: 38,
    pattern:
      /(\bunion\b\s+\bselect\b|\bor\b\s+['"]?1['"]?\s*=\s*['"]?1|--|\/\*|\bdrop\b\s+\btable\b|\binformation_schema\b)/i,
    evidence:
      "Detected SQL keywords or boolean-bypass syntax commonly used in injection payloads.",
  },
  {
    name: "Cross-Site Scripting Signature",
    type: "XSS",
    severity: 36,
    pattern:
      /(<script\b|javascript:|onerror\s*=|onload\s*=|<img\b[^>]*src=|document\.cookie)/i,
    evidence:
      "Detected script execution markers commonly used for browser-side payloads.",
  },
  {
    name: "Directory Traversal Signature",
    type: "Directory Traversal",
    severity: 34,
    pattern: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\\|\/etc\/passwd|boot\.ini)/i,
    evidence:
      "Detected path traversal markers that attempt to escape the intended directory.",
  },
  {
    name: "Local File Inclusion Signature",
    type: "LFI",
    severity: 32,
    pattern:
      /(file=|page=|path=).*(\/etc\/passwd|boot\.ini|php:\/\/|\.{2}\/)/i,
    evidence:
      "Detected file inclusion parameters targeting sensitive local resources.",
  },
  {
    name: "Command Injection Signature",
    type: "Command Injection",
    severity: 40,
    pattern:
      /(;|\||&&|\$\(|`)\s*(cat|ls|whoami|id|curl|wget|nc|bash|powershell|cmd\.exe)/i,
    evidence:
      "Detected shell separators followed by operating system commands.",
  },
  {
    name: "Encoded Payload Signature",
    type: "Encoded Payload",
    severity: 22,
    pattern: /(%3c|%3e|%27|%22|%3b|%7c|base64,|\\x[0-9a-f]{2})/i,
    evidence:
      "Detected encoded characters often used to hide malicious payloads.",
  },
  {
    name: "Suspicious Scanner Path",
    type: "Reconnaissance",
    severity: 20,
    pattern:
      /(wp-admin|wp-login|\.env|phpmyadmin|admin\/login|config\.php|\.git)/i,
    evidence:
      "Detected common automated scanner or sensitive administration paths.",
  },
];

const normalizeHeaders = (
  headers?: Record<string, string>
) => {
  if (!headers) {
    return "";
  }

  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
};

const getDomain = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
};

const recordTraffic = (ipAddress: string) => {
  const now = Date.now();
  const existing = trafficTracker.get(ipAddress);

  if (
    !existing ||
    now - existing.firstSeen > RATE_LIMIT_WINDOW_MS
  ) {
    trafficTracker.set(ipAddress, {
      count: 1,
      firstSeen: now,
    });

    return 1;
  }

  existing.count += 1;
  trafficTracker.set(ipAddress, existing);

  return existing.count;
};

export const analyzeRequest = (
  scanData: CreateScanDto
): ScanAnalysisResult => {
  const ipAddress = scanData.ipAddress || "unknown";
  const trafficCount = recordTraffic(ipAddress);
  const inspectableContent = [
    scanData.url,
    scanData.method || "GET",
    normalizeHeaders(scanData.headers),
    scanData.body || "",
  ].join("\n");

  const matches = rules.filter((rule) =>
    rule.pattern.test(inspectableContent)
  );

  const detectionRules = matches.map((rule) => rule.name);
  const evidence = matches.map((rule) => rule.evidence);
  const attackTypes = Array.from(
    new Set(matches.map((rule) => rule.type))
  );

  let riskScore = matches.reduce(
    (score, rule) => score + rule.severity,
    0
  );

  if (trafficCount > RATE_LIMIT_THRESHOLD) {
    riskScore += 30;
    detectionRules.push("Rate Limit Threshold");
    evidence.push(
      `IP ${ipAddress} crossed ${RATE_LIMIT_THRESHOLD} requests in one minute.`
    );
    attackTypes.push("Abusive Traffic");
  }

  riskScore = Math.min(riskScore, 100);

  const blocked = riskScore >= 60;
  const threatLevel =
    trafficCount > RATE_LIMIT_THRESHOLD
      ? "Rate Limited"
      : blocked
        ? "Blocked"
        : riskScore >= 40
          ? "Malicious"
          : riskScore > 0
            ? "Suspicious"
            : "Safe";

  const threatType =
    attackTypes.length > 0
      ? Array.from(new Set(attackTypes)).join(", ")
      : "None";

  const recommendation =
    threatLevel === "Safe"
      ? "Request appears safe. Continue monitoring normal traffic patterns."
      : blocked
        ? "Block this request, review the source IP, and tune WAF rules if repeated."
        : "Review this request manually and monitor for repeated attempts.";

  return {
    domain: scanData.domain || getDomain(scanData.url),
    threatLevel,
    threatType,
    riskScore,
    blocked,
    detectionRules,
    evidence,
    recommendation,
  };
};

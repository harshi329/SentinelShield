# SentinelShield — Advanced Intrusion Detection & Web Protection System
## Practical Work Documentation

**Student Project | Cybersecurity Practical Submission**
**Tech Stack:** React · TypeScript · Node.js · Express · MongoDB · Tailwind CSS

---

## 1. PROJECT OVERVIEW

SentinelShield is a full-stack web application that simulates a lightweight **Web Application Firewall (WAF)** and **Intrusion Detection System (IDS)**. It inspects HTTP requests, detects malicious patterns, monitors traffic behavior, logs threats, and presents real-time analytics on a dashboard.

The system is designed to help students understand how real-world cybersecurity tools detect, analyze, and respond to web-based attacks.

---

## 2. PROJECT OBJECTIVES

By completing this practical, the student will be able to:

- Understand how WAFs detect threats using pattern matching and rule engines
- Analyze HTTP requests from a security perspective
- Identify SQL Injection, XSS, LFI, Directory Traversal, Command Injection, and Encoded Payload attacks
- Interpret threat logs and risk scores
- Understand rate limiting and abusive traffic detection
- Generate encrypted PDF security reports
- Deploy a full-stack web application

---

## 3. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (React + Vite)                │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐  │
│  │Dashboard │ │Analyzer  │ │ThreatLogs │ │Analytics │  │
│  └──────────┘ └──────────┘ └───────────┘ └──────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (Axios / REST API)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   SERVER (Express + TypeScript)          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Auth Routes  │  │ Scan Routes  │  │Report Routes │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│  ┌──────▼───────────────────────────────────▼───────┐  │
│  │           Detection Engine (Rule-Based WAF)       │  │
│  │  SQL Injection · XSS · LFI · Traversal · CMDi    │  │
│  │  Encoded Payloads · Recon · Rate Limiting         │  │
│  └──────────────────────────────┬────────────────────┘  │
│                                  │                       │
│  ┌───────────────────────────────▼──────────────────┐   │
│  │           Email Service (Nodemailer/Gmail)        │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │ Mongoose ODM
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    MongoDB Database                      │
│         Collections: users · scans                      │
└─────────────────────────────────────────────────────────┘
```

---

## 4. FEATURES IMPLEMENTED

### 4.1 Authentication System
| Feature | Status |
|---|---|
| User Registration | ✅ Complete |
| Login with OTP Verification | ✅ Complete |
| JWT Token Authentication | ✅ Complete |
| Forgot Password (OTP-based reset) | ✅ Complete |
| Change Password (Settings page) | ✅ Complete |
| Email OTP via Gmail SMTP | ✅ Complete |

### 4.2 Analyzer (WAF Engine)
| Feature | Status |
|---|---|
| URL / Request inspection | ✅ Complete |
| SQL Injection detection | ✅ Complete |
| XSS detection | ✅ Complete |
| Directory Traversal detection | ✅ Complete |
| Local File Inclusion (LFI) detection | ✅ Complete |
| Command Injection detection | ✅ Complete |
| Encoded Payload detection | ✅ Complete |
| Reconnaissance / Scanner Path detection | ✅ Complete |
| Rate Limiting (IP-based, 8 req/min) | ✅ Complete |
| Risk Score calculation (0–100) | ✅ Complete |
| Verdict: Safe / Suspicious / Malicious / Blocked / Rate Limited | ✅ Complete |
| Evidence and Recommendation generation | ✅ Complete |

### 4.3 Dashboard
| Feature | Status |
|---|---|
| Total scans stat card | ✅ Complete |
| Threats detected stat card | ✅ Complete |
| Safe URLs stat card | ✅ Complete |
| Average risk score stat card | ✅ Complete |
| Recent scan activity table | ✅ Complete |
| Live threat feed | ✅ Complete |
| Attack distribution chart | ✅ Complete |
| Top flagged IPs | ✅ Complete |
| Security posture score | ✅ Complete |

### 4.4 Threat Logs
| Feature | Status |
|---|---|
| Full scan history with pagination | ✅ Complete |
| Filter by threat level | ✅ Complete |
| Delete scan entries | ✅ Complete |

### 4.5 Analytics
| Feature | Status |
|---|---|
| Attack type breakdown | ✅ Complete |
| Risk score trends | ✅ Complete |
| Detection statistics | ✅ Complete |

### 4.6 Report Generation
| Feature | Status |
|---|---|
| PDF threat report generation | ✅ Complete |
| AES-256 encrypted PDF (via qpdf) | ✅ Complete |
| KPI summary, attack distribution, full log table | ✅ Complete |

### 4.7 Settings
| Feature | Status |
|---|---|
| Profile with cybersecurity avatar picker (16 avatars) | ✅ Complete |
| Change password with OTP | ✅ Complete |
| Security preference toggles | ✅ Complete |
| Scan sensitivity slider | ✅ Complete |
| Theme toggle (Dark / Light) | ✅ Complete |
| System status indicators | ✅ Complete |

---

## 5. DETECTION ENGINE — HOW IT WORKS

The detection engine (`server/src/services/detectionEngine.ts`) is the core of the system. It applies 7 rule-based patterns and 1 behavioral check to every incoming request.

### 5.1 Attack Rules

| Rule | Attack Type | Severity | Pattern Description |
|---|---|---|---|
| SQL Injection Signature | SQL Injection | 38 | UNION SELECT, OR 1=1, DROP TABLE, --, information_schema |
| Cross-Site Scripting Signature | XSS | 36 | `<script>`, `javascript:`, `onerror=`, `document.cookie` |
| Directory Traversal Signature | Directory Traversal | 34 | `../`, `%2e%2e/`, `/etc/passwd`, `boot.ini` |
| Local File Inclusion Signature | LFI | 32 | `file=`, `page=`, `php://`, targeting local files |
| Command Injection Signature | Command Injection | 40 | `;`, `|`, `&&` followed by `cat`, `whoami`, `bash`, etc. |
| Encoded Payload Signature | Encoded Payload | 22 | `%3c`, `%27`, `base64,`, `\x` hex encoding |
| Suspicious Scanner Path | Reconnaissance | 20 | `wp-admin`, `.env`, `phpmyadmin`, `.git` |

### 5.2 Risk Score Calculation

```
Risk Score = Sum of matched rule severities
           + 30 (if IP exceeds 8 requests/minute)
           (capped at 100)
```

### 5.3 Verdict Logic

| Condition | Verdict |
|---|---|
| Risk Score = 0 | Safe |
| Risk Score 1–39 | Suspicious |
| Risk Score 40–59 | Malicious |
| Risk Score ≥ 60 | Blocked |
| IP > 8 req/min | Rate Limited |

---

## 6. DATABASE SCHEMA

### 6.1 User Collection
```
{
  name:       String  (required)
  email:      String  (unique, lowercase)
  password:   String  (bcrypt hashed, 12 rounds)
  otp:        String  (6-digit, temporary)
  otpExpiry:  Date    (10 minutes from generation)
  otpType:    "login" | "change-password"
  isVerified: Boolean
  createdAt:  Date
  updatedAt:  Date
}
```

### 6.2 Scan Collection
```
{
  url:            String  (inspected URL)
  method:         String  (GET/POST/etc.)
  ipAddress:      String  (source IP)
  requestBody:    String  (optional body)
  domain:         String  (extracted hostname)
  threatLevel:    "Safe" | "Suspicious" | "Malicious" | "Blocked" | "Rate Limited"
  threatType:     String  (e.g., "SQL Injection, XSS")
  riskScore:      Number  (0–100)
  scanMode:       "Quick" | "Deep" | "AI"
  blocked:        Boolean
  detectionRules: [String]  (matched rule names)
  evidence:       [String]  (human-readable evidence)
  recommendation: String
  createdAt:      Date
  updatedAt:      Date
}
```

---

## 7. API ENDPOINTS

### Authentication
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create new account | Public |
| POST | `/api/auth/login` | Login step 1 — sends OTP | Public |
| POST | `/api/auth/verify-otp` | Login step 2 — verify OTP | Public |
| POST | `/api/auth/resend-otp` | Resend login OTP | Public |
| POST | `/api/auth/forgot-password` | Send password reset OTP | Public |
| POST | `/api/auth/reset-password` | Reset password with OTP | Public |
| GET  | `/api/auth/me` | Get current user | Protected |
| POST | `/api/auth/change-password` | Request password change OTP | Protected |
| POST | `/api/auth/confirm-password` | Confirm password change | Protected |

### Scans
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/scans` | Submit URL for analysis | Public |
| GET  | `/api/scans` | Get all scan records | Public |
| GET  | `/api/scans/summary` | Get dashboard summary stats | Public |
| GET  | `/api/scans/:id` | Get single scan by ID | Public |
| DELETE | `/api/scans/:id` | Delete a scan record | Public |

### Reports
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/report/generate` | Generate encrypted PDF report | Public |

---

## 8. HOW TO RUN LOCALLY

### Prerequisites
- Node.js v18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`)
- Gmail account with App Password enabled

### Step 1 — Clone and install
```bash
# Server
cd server
npm install

# Client
cd client
npm install
```

### Step 2 — Configure environment
Edit `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/sentinelshield
JWT_SECRET=your_secret_key_here
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_gmail_app_password
CLIENT_URL=
```

### Step 3 — Run
```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

### Step 4 — Open browser
```
http://localhost:5173
```

---

## 9. PRACTICAL WORKFLOW

### Step 1 — Register & Login
1. Go to `http://localhost:5173`
2. Click Register, enter name, email, password
3. Check your email for OTP
4. Enter OTP to complete login

### Step 2 — Submit Test Payloads in Analyzer

| Test Case | URL to Submit | Expected Verdict |
|---|---|---|
| Normal request | `https://example.com/products?id=10` | Safe |
| SQL Injection | `https://example.com/login?user=admin' OR '1'='1--` | Blocked |
| XSS | `https://example.com/search?q=<script>alert(1)</script>` | Blocked |
| Directory Traversal | `https://example.com/download?file=../../etc/passwd` | Malicious |
| LFI | `https://example.com/page?file=php://filter` | Suspicious |
| Command Injection | `https://example.com/ping?host=127.0.0.1;whoami` | Blocked |
| Encoded Payload | `https://example.com/search?q=%3Cscript%3E` | Suspicious |
| Recon Path | `https://example.com/.env` | Suspicious |
| Rate Limit Test | Submit any URL 9+ times rapidly | Rate Limited |

### Step 3 — Observe Dashboard
- Check stat cards update after each scan
- View Recent Scan Activity table
- Check Live Threat Feed for flagged requests

### Step 4 — Analyze Threat Logs
- Go to Threat Logs page
- Filter by "Malicious" or "Blocked"
- Note IP addresses, timestamps, attack types, risk scores

### Step 5 — View Analytics
- Check attack type distribution
- Observe risk score patterns

### Step 6 — Generate Report
- Go to Analytics or a report page
- Enter owner and recipient passwords (must be different, min 4 chars)
- Download the AES-256 encrypted PDF
- Open PDF with the recipient password

---

## 10. PRACTICAL OBSERVATIONS TABLE

Use this table in your journal to record results:

| # | URL Submitted | Attack Type | Risk Score | Verdict | Blocked? |
|---|---|---|---|---|---|
| 1 | `https://example.com/products?id=10` | None | 0 | Safe | No |
| 2 | `https://example.com/login?user=admin' OR '1'='1--` | SQL Injection | 38 | Blocked | Yes |
| 3 | `https://example.com/search?q=<script>alert(1)</script>` | XSS | 36 | Blocked | Yes |
| 4 | `https://example.com/download?file=../../etc/passwd` | Directory Traversal | 34 | Malicious | No |
| 5 | `https://example.com/page?file=php://filter` | LFI | 32 | Suspicious | No |
| 6 | `https://example.com/ping?host=127.0.0.1;whoami` | Command Injection | 40 | Blocked | Yes |
| 7 | `https://example.com/search?q=%3Cscript%3E` | Encoded Payload | 22 | Suspicious | No |
| 8 | `https://example.com/.env` | Reconnaissance | 20 | Suspicious | No |
| 9 | (submit any URL 9 times fast) | Abusive Traffic | 50+ | Rate Limited | Yes |

---

## 11. FINAL ANALYSIS SUMMARY

| Metric | Value |
|---|---|
| Total attack types covered | 7 |
| Detection method | Rule-based regex pattern matching |
| Rate limit window | 60 seconds |
| Rate limit threshold | 8 requests/IP |
| Maximum risk score | 100 |
| Block threshold | Risk Score ≥ 60 |
| Password hashing | bcrypt (12 rounds) |
| JWT expiry | 7 days |
| OTP expiry | 10 minutes |
| PDF encryption | AES-256 via qpdf |

### Detection Accuracy Assessment
- **True Positives:** Malicious URLs correctly flagged (SQL, XSS, CMDi)
- **False Positives:** Legitimate URLs with encoded characters may score > 0
- **False Negatives:** Novel/obfuscated attacks not matching known patterns
- **Improvement Areas:** Add ML-based anomaly detection, expand rule set, add geolocation blocking

---

## 12. IS THE PROJECT COMPLETE? CAN YOU DEPLOY?

### ✅ What is Complete
- Full authentication with OTP email verification
- WAF detection engine with 7 attack categories + rate limiting
- Dashboard with live stats, charts, threat feed
- Threat logs with filtering and deletion
- Analytics page
- AES-256 encrypted PDF report generation
- Settings with avatar picker, change password, theme toggle
- Forgot password flow

### ⚠️ Before Deploying — Checklist

**Backend:**
- [ ] Create a MongoDB Atlas account and get a cloud `MONGO_URI`
- [ ] Set a strong `JWT_SECRET` (at least 32 random characters)
- [ ] Confirm Gmail App Password is working
- [ ] Remove `qpdf` dependency or provide it in the deployment environment (PDF encryption requires qpdf binary)
- [ ] Deploy to Railway / Render / Heroku

**Frontend:**
- [ ] Set `VITE_API_URL` in `client/.env` to your deployed backend URL
- [ ] Run `npm run build` in `client/`
- [ ] Deploy `dist/` folder to Vercel / Netlify / GitHub Pages

**Environment Variables for Production:**
```env
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/sentinelshield
JWT_SECRET=<strong_random_string>
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_app_password
CLIENT_URL=https://your-frontend-domain.com
```

### 🚀 Recommended Free Deployment Stack
| Service | What to deploy |
|---|---|
| [Railway.app](https://railway.app) | Backend (Node.js + Express) |
| [MongoDB Atlas](https://cloud.mongodb.com) | Database (free 512MB tier) |
| [Vercel](https://vercel.com) | Frontend (React + Vite) |

---

*Documentation generated for SentinelShield v1.0.0 — Practical Submission*

# 🛡️ SentinelShield — Advanced Intrusion Detection & Web Protection System

A full-stack cybersecurity platform that simulates a lightweight **Web Application Firewall (WAF)** and **Intrusion Detection System (IDS)**.

---

## ✨ Features

- 🔐 JWT Authentication with OTP email verification
- 🧠 AI-enhanced rule-based threat detection (7 attack categories)
- 📊 Real-time dashboard with live threat feed
- 📋 Threat logs with filtering
- 📈 Analytics and attack distribution charts
- 🔒 AES-256 encrypted PDF report generation
- 🎨 16 cybersecurity avatars, dark/light theme

## 🚀 Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/sentinelshield.git
cd sentinelshield
```

### 2. Setup server
```bash
cd server
npm install
cp .env.example .env
# Fill in your values in .env
npm run dev
```

### 3. Setup client
```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt, Nodemailer (Gmail OTP) |
| PDF | PDFKit + qpdf (AES-256) |

## 🔍 Attack Detection Coverage

| Attack Type | Severity Score |
|---|---|
| Command Injection | 40 |
| SQL Injection | 38 |
| Cross-Site Scripting (XSS) | 36 |
| Directory Traversal | 34 |
| Local File Inclusion (LFI) | 32 |
| Encoded Payload | 22 |
| Reconnaissance | 20 |
| Rate Limiting (8 req/min) | +30 |

## 📁 Project Structure

```
sentinelshield/
├── client/          # React frontend
│   └── src/
│       ├── pages/   # Dashboard, Analyzer, Logs, Analytics, Settings, Login
│       ├── components/
│       ├── contexts/
│       └── api/
└── server/          # Express backend
    └── src/
        ├── controllers/
        ├── services/    # Detection engine, email service
        ├── models/      # User, Scan
        ├── routes/
        └── middleware/
```

## ⚙️ Environment Variables

Copy `server/.env.example` to `server/.env` and fill in:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/sentinelshield
JWT_SECRET=your_secret
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_app_password
```

---

*SentinelShield v1.0.0 — Practical Cybersecurity Project*

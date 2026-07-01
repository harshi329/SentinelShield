import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import Scan from "../models/Scan";
import { execFile } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";

// Path to qpdf — installed via winget
const QPDF_PATH = "C:\\Program Files\\qpdf 12.3.2\\bin\\qpdf.exe";

// Encrypt a PDF buffer with AES-256 using qpdf
const encryptWithQpdf = (
  inputBuf: Buffer,
  ownerPassword: string,
  userPassword: string,
): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    const id   = randomBytes(8).toString("hex");
    const inF  = join(tmpdir(), `ss-in-${id}.pdf`);
    const outF = join(tmpdir(), `ss-out-${id}.pdf`);

    try {
      await writeFile(inF, inputBuf);

      execFile(
        QPDF_PATH,
        [
          "--encrypt", userPassword, ownerPassword, "256",
          "--print=low",
          "--modify=none",
          "--extract=n",
          "--annotate=n",
          "--",
          inF,
          outF,
        ],
        async (err, _stdout, stderr) => {
          try {
            if (err) { reject(new Error(stderr || err.message)); return; }
            const buf = await readFile(outF);
            resolve(buf);
          } finally {
            unlink(inF).catch(() => {});
            unlink(outF).catch(() => {});
          }
        },
      );
    } catch (e) {
      unlink(inF).catch(() => {});
      reject(e);
    }
  });
};

export const generateReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { ownerPassword, userPassword } = req.body as {
      ownerPassword?: string;
      userPassword?: string;
    };

    if (!ownerPassword || ownerPassword.length < 4) {
      res.status(400).json({ success: false, message: "Owner password must be at least 4 characters." });
      return;
    }
    if (!userPassword || userPassword.length < 4) {
      res.status(400).json({ success: false, message: "Recipient password must be at least 4 characters." });
      return;
    }
    if (ownerPassword === userPassword) {
      res.status(400).json({ success: false, message: "Passwords must be different." });
      return;
    }

    const scans = await Scan.find().sort({ createdAt: -1 }).lean();

    // ── Colours ────────────────────────────────────────────────
    const BG       = "#0F172A";
    const SURFACE  = "#1E293B";
    const ACCENT   = "#38BDF8";
    const RED      = "#EF4444";
    const AMBER    = "#F59E0B";
    const GREEN    = "#22C55E";
    const PURPLE   = "#A78BFA";
    const TEXT     = "#E2E8F0";
    const MUTED    = "#64748B";

    const total    = scans.length;
    const malicious = scans.filter((s) => ["Malicious","Blocked","Rate Limited"].includes(s.threatLevel)).length;
    const blocked  = scans.filter((s) => s.blocked).length;
    const safe     = scans.filter((s) => s.threatLevel === "Safe").length;
    const suspicious = scans.filter((s) => s.threatLevel === "Suspicious").length;
    const avgRisk  = total === 0 ? 0 : Math.round(scans.reduce((a, s) => a + s.riskScore, 0) / total);
    const detRate  = total === 0 ? 0 : Math.round((malicious / total) * 100);
    const falsePos = scans.filter((s) => s.threatLevel !== "Safe" && s.threatLevel !== "Unknown" && s.riskScore < 20).length;

    const threatDist: Record<string, number> = {};
    scans.forEach((s) => {
      const k = s.threatType || "None";
      threatDist[k] = (threatDist[k] || 0) + 1;
    });

    // ── Build PDF (no built-in encryption — qpdf handles it) ──
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title: "SentinelShield Threat Report",
        Author: "SentinelShield",
        Subject: "Security Threat Analysis Report",
        Keywords: "security, threats, WAF, intrusion detection",
      },
      pdfVersion: "1.7",
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));

    await new Promise<void>((resolve) => {
      doc.on("end", resolve);

      const PW   = 595.28;  // A4 width in points
      const PH   = 841.89;  // A4 height in points
      const ML   = 40;
      const MR   = PW - 40;
      const COL  = MR - ML;

      // ── Helper: filled rect ──────────────────────────────────
      const fillRect = (x: number, y: number, w: number, h: number, color: string) => {
        doc.save().rect(x, y, w, h).fill(color).restore();
      };

      // ── Page background ──────────────────────────────────────
      fillRect(0, 0, PW, PH, BG);

      // ── Header banner ────────────────────────────────────────
      fillRect(0, 0, PW, 72, SURFACE);
      // Left accent bar
      fillRect(0, 0, 4, 72, ACCENT);

      doc.font("Helvetica-Bold").fontSize(20).fillColor(TEXT).text("SentinelShield", ML + 10, 16);
      doc.font("Helvetica").fontSize(9).fillColor(MUTED).text("Advanced Intrusion Detection & Web Protection System", ML + 10, 40);
      doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(`Threat Report  ·  Generated: ${new Date().toLocaleString()}`, ML + 10, 54);

      // Right: confidential badge
      doc.font("Helvetica-Bold").fontSize(8).fillColor(RED)
         .text("🔒  CONFIDENTIAL — ENCRYPTED", MR - 190, 20, { width: 190, align: "right" });
      doc.font("Helvetica").fontSize(8).fillColor(MUTED)
         .text(`Total Records: ${total}`, MR - 190, 34, { width: 190, align: "right" });
      doc.font("Helvetica").fontSize(7).fillColor(MUTED)
         .text(`Protected with AES-256 Encryption`, MR - 190, 47, { width: 190, align: "right" });

      let y = 82;

      // ── Section title helper ─────────────────────────────────
      const sectionTitle = (title: string, yPos: number) => {
        doc.font("Helvetica-Bold").fontSize(7).fillColor(ACCENT)
           .text(title.toUpperCase(), ML, yPos);
        doc.save().moveTo(ML, yPos + 11).lineTo(MR, yPos + 11)
           .strokeColor(SURFACE).lineWidth(1).stroke().restore();
        return yPos + 16;
      };

      // ── KPI grid (2 rows × 4 cols) ────────────────────────────
      y = sectionTitle("Security Summary", y);
      const kpis = [
        { label: "Total Scans",      value: String(total),      color: ACCENT },
        { label: "Threats Detected", value: String(malicious),  color: RED    },
        { label: "Blocked",          value: String(blocked),    color: RED    },
        { label: "Safe",             value: String(safe),       color: GREEN  },
        { label: "Suspicious",       value: String(suspicious), color: AMBER  },
        { label: "Avg Risk Score",   value: `${avgRisk}/100`,   color: AMBER  },
        { label: "Detection Rate",   value: `${detRate}%`,      color: ACCENT },
        { label: "Est. False Pos.",  value: String(falsePos),   color: MUTED  },
      ];
      const boxW = (COL - 14) / 4;
      const boxH = 38;
      kpis.forEach(({ label, value, color }, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const bx = ML + col * (boxW + 4.67);
        const by = y + row * (boxH + 6);
        fillRect(bx, by, boxW, boxH, SURFACE);
        doc.font("Helvetica-Bold").fontSize(16).fillColor(color)
           .text(value, bx + 8, by + 8, { width: boxW - 16 });
        doc.font("Helvetica").fontSize(7).fillColor(MUTED)
           .text(label, bx + 8, by + 26, { width: boxW - 16 });
      });
      y += 2 * (boxH + 6) + 10;

      // ── Attack Distribution ──────────────────────────────────
      const attackEntries = Object.entries(threatDist)
        .filter(([n]) => n !== "None")
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

      if (attackEntries.length > 0) {
        y = sectionTitle("Attack Type Distribution", y);
        const barColors = [RED, AMBER, ACCENT, PURPLE, GREEN, "#F97316"];
        attackEntries.forEach(([name, count], i) => {
          const pct = total > 0 ? count / total : 0;
          const barMaxW = COL - 100;
          fillRect(ML, y, barMaxW * pct, 14, barColors[i % barColors.length] + "66");
          fillRect(ML, y, Math.max(3, barMaxW * pct - 1), 14, barColors[i % barColors.length]);
          doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT)
             .text(name, ML + 6, y + 3, { width: barMaxW - 12 });
          doc.font("Helvetica").fontSize(8).fillColor(MUTED)
             .text(`${count}  (${Math.round(pct * 100)}%)`, ML + barMaxW + 6, y + 3);
          y += 20;
        });
        y += 6;
      }

      // ── Logs Table ───────────────────────────────────────────
      y = sectionTitle("Threat Log Records", y);

      // Table header
      const cols = [
        { label: "#",           x: ML,       w: 22  },
        { label: "Timestamp",   x: ML + 22,  w: 90  },
        { label: "URL",         x: ML + 112, w: 155 },
        { label: "IP Address",  x: ML + 267, w: 75  },
        { label: "Threat Type", x: ML + 342, w: 75  },
        { label: "Risk",        x: ML + 417, w: 32  },
        { label: "Status",      x: ML + 449, w: 66  },
      ];

      fillRect(ML, y, COL, 16, ACCENT + "22");
      cols.forEach(({ label, x }) => {
        doc.font("Helvetica-Bold").fontSize(7).fillColor(ACCENT)
           .text(label, x + 3, y + 5);
      });
      y += 16;

      const ROW_H = 18;
      let pageScans = 0;

      scans.forEach((scan, idx) => {
        // New page if needed
        if (y + ROW_H > PH - 30) {
          doc.addPage({ size: "A4", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
          fillRect(0, 0, PW, PH, BG);
          y = 20;
          // Repeat header
          fillRect(ML, y, COL, 16, ACCENT + "22");
          cols.forEach(({ label, x }) => {
            doc.font("Helvetica-Bold").fontSize(7).fillColor(ACCENT).text(label, x + 3, y + 5);
          });
          y += 16;
          pageScans = 0;
        }

        const rowBg = pageScans % 2 === 0 ? BG : SURFACE;
        fillRect(ML, y, COL, ROW_H, rowBg);

        const statusColor =
          scan.threatLevel === "Safe" ? GREEN :
          ["Malicious","Blocked"].includes(scan.threatLevel) ? RED :
          scan.threatLevel === "Suspicious" ? AMBER :
          scan.threatLevel === "Rate Limited" ? PURPLE : MUTED;

        const rowData = [
          { text: String(idx + 1), x: cols[0].x, w: cols[0].w, color: MUTED },
          { text: new Date(scan.createdAt).toLocaleString(), x: cols[1].x, w: cols[1].w, color: MUTED },
          { text: scan.url.length > 38 ? scan.url.slice(0, 38) + "…" : scan.url, x: cols[2].x, w: cols[2].w, color: TEXT },
          { text: scan.ipAddress, x: cols[3].x, w: cols[3].w, color: MUTED },
          { text: scan.threatType, x: cols[4].x, w: cols[4].w, color: statusColor },
          { text: String(scan.riskScore), x: cols[5].x, w: cols[5].w, color: statusColor },
          { text: scan.threatLevel, x: cols[6].x, w: cols[6].w, color: statusColor },
        ];

        rowData.forEach(({ text, x, w, color }) => {
          doc.font("Helvetica").fontSize(7).fillColor(color)
             .text(text, x + 3, y + 6, { width: w - 6, lineBreak: false });
        });

        y += ROW_H;
        pageScans++;
      });

      // ── Footer on last page ──────────────────────────────────
      const totalPages = (doc.bufferedPageRange().start + doc.bufferedPageRange().count);
      fillRect(0, PH - 22, PW, 22, SURFACE);
      doc.font("Helvetica").fontSize(7).fillColor(MUTED)
         .text("SentinelShield  ·  Confidential Security Report  ·  AES-256 Encrypted", ML, PH - 14);
      doc.font("Helvetica").fontSize(7).fillColor(MUTED)
         .text(`Page ${totalPages}  ·  ${total} records`, MR, PH - 14, { align: "right" });

      doc.end();
    });

    const rawPdfBuffer = Buffer.concat(chunks);

    // ── Apply AES-256 encryption via qpdf ─────────────────────
    // userPassword  = recipient must enter this to OPEN/VIEW the PDF
    // ownerPassword = full control (sender keeps this)
    const encryptedBuffer = await encryptWithQpdf(rawPdfBuffer, ownerPassword, userPassword);

    const filename = `sentinelshield-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", encryptedBuffer.length);
    res.send(encryptedBuffer);
  } catch (error) {
    console.error("Report generation error:", error);
    res.status(500).json({ success: false, message: "Failed to generate report." });
  }
};

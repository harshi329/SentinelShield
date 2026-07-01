import mongoose, { Document } from "mongoose";
import type { ThreatLevel, ScanMode } from "../types/scan";

export interface IScan extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const scanSchema = new mongoose.Schema<IScan>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    method: {
      type: String,
      default: "GET",
      uppercase: true,
      trim: true,
    },

    ipAddress: {
      type: String,
      default: "unknown",
      trim: true,
    },

    requestBody: {
      type: String,
      default: "",
    },

    domain: {
      type: String,
      default: "",
    },

    threatLevel: {
      type: String,
      enum: [
        "Safe",
        "Suspicious",
        "Malicious",
        "Blocked",
        "Rate Limited",
        "Unknown",
      ],
      default: "Unknown",
    },

    threatType: {
      type: String,
      default: "None",
    },

    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    scanMode: {
      type: String,
      enum: ["Quick", "Deep", "AI"],
      default: "AI",
    },

    blocked: {
      type: Boolean,
      default: false,
    },

    detectionRules: {
      type: [String],
      default: [],
    },

    evidence: {
      type: [String],
      default: [],
    },

    recommendation: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IScan>("Scan", scanSchema);

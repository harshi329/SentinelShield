import { Request, Response } from "express";

import {
  createScanService,
  getAllScansService,
  getScanByIdService,
  deleteScanService,
  getScanSummaryService,
} from "../services/scanService";

// ==========================================
// Create Scan
// ==========================================
export const createScan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const ipAddress =
      req.body.ipAddress ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown";

    const scan = await createScanService({
      ...req.body,
      ipAddress,
    });

    res.status(201).json({
      success: true,
      message: "Scan created successfully",
      data: scan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

// ==========================================
// Get All Scans
// ==========================================
export const getScans = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const scans = await getAllScansService();

    res.status(200).json({
      success: true,
      count: scans.length,
      data: scans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

// ==========================================
// Get Scan By ID
// ==========================================
export const getScanById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const scan = await getScanByIdService(String(req.params.id));

    if (!scan) {
      res.status(404).json({
        success: false,
        message: "Scan not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: scan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

// ==========================================
// Delete Scan
// ==========================================
export const deleteScan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deleted = await deleteScanService(String(req.params.id));
    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Scan not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Scan deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

// ==========================================
// Get Scan Summary
// ==========================================
export const getScanSummary = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const summary = await getScanSummaryService();

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

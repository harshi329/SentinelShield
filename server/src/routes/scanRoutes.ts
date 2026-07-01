import { Router } from "express";

import {
  createScan,
  getScans,
  getScanById,
  deleteScan,
  getScanSummary,
} from "../controllers/scanController";

import validate from "../middleware/validate";
import { createScanSchema } from "../validators/scan.validator";

const router = Router();

router.post(
  "/",
  validate(createScanSchema),
  createScan
);

router.get("/", getScans);

router.get("/summary", getScanSummary);

router.get("/:id", getScanById);

router.delete("/:id", deleteScan);

export default router;

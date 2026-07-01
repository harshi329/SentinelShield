import { Router } from "express";
import { generateReport } from "../controllers/reportController";

const router = Router();

// POST /api/report/pdf
// Body: { ownerPassword: string, userPassword: string }
router.post("/pdf", generateReport);

export default router;

import { Router } from "express";
import {
  register,
  login,
  verifyOTP,
  resendOTP,
  getMe,
  requestPasswordChange,
  confirmPasswordChange,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/register",          register);
router.post("/login",             login);
router.post("/verify-otp",        verifyOTP);
router.post("/resend-otp",        resendOTP);
router.get("/me",                 protect, getMe);
router.post("/change-password",   protect, requestPasswordChange);
router.post("/confirm-password",  protect, confirmPasswordChange);
router.post("/forgot-password",   forgotPassword);
router.post("/reset-password",    resetPassword);

export default router;

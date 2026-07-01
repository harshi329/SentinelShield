import { Request, Response } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { sendOTPEmail, sendPasswordChangedEmail } from "../services/emailService";
import { AuthRequest } from "../middleware/authMiddleware";

const generateOTP = () =>
  crypto.randomInt(100000, 999999).toString();

const signToken = (userId: string, name: string, email: string) =>
  jwt.sign({ userId, name, email }, process.env.JWT_SECRET!, { expiresIn: "7d" });

// ── Register ──────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: "All fields are required." });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ success: false, message: "An account with this email already exists." });
      return;
    }

    const otp      = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name, email, password,
      otp, otpExpiry, otpType: "login",
      isVerified: false,
    });

    await sendOTPEmail(email, name, otp, "login");

    res.status(201).json({
      success: true,
      message: "Account created. OTP sent to your email.",
      userId: user._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Registration failed." });
  }
};

// ── Login (step 1 — send OTP) ────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ success: false, message: "Invalid email or password." });
      return;
    }

    const otp       = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp       = otp;
    user.otpExpiry = otpExpiry;
    user.otpType   = "login";
    await user.save();

    await sendOTPEmail(email, user.name, otp, "login");

    res.status(200).json({
      success: true,
      message: "OTP sent to your email.",
      userId: user._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Login failed." });
  }
};

// ── Verify OTP (step 2 — complete login / registration) ──────────────────────
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    if (!user.otp || user.otp !== otp) {
      res.status(400).json({ success: false, message: "Incorrect OTP." });
      return;
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
      return;
    }

    user.isVerified = true;
    user.otp        = undefined;
    user.otpExpiry  = undefined;
    user.otpType    = undefined;
    await user.save();

    const token = signToken(String(user._id), user.name, user.email);

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "OTP verification failed." });
  }
};

// ── Resend OTP ────────────────────────────────────────────────────────────────
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    const otp       = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otp        = otp;
    user.otpExpiry  = otpExpiry;
    user.otpType    = "login";
    await user.save();

    await sendOTPEmail(user.email, user.name, otp, "login");

    res.status(200).json({ success: true, message: "New OTP sent." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to resend OTP." });
  }
};

// ── Forgot Password (step 1 — send OTP by email) ─────────────────────────────
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: "Email is required." });
      return;
    }

    const user = await User.findOne({ email });
    // Always return success to avoid email enumeration
    if (!user) {
      res.status(200).json({ success: true, message: "If that email exists, an OTP has been sent." });
      return;
    }

    const otp       = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otp        = otp;
    user.otpExpiry  = otpExpiry;
    user.otpType    = "change-password";
    await user.save();

    await sendOTPEmail(user.email, user.name, otp, "change-password");

    res.status(200).json({
      success: true,
      message: "OTP sent to your email.",
      userId: user._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to send OTP." });
  }
};

// ── Forgot Password (step 2 — verify OTP + set new password) ─────────────────
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, otp, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    if (user.otpType !== "change-password") {
      res.status(400).json({ success: false, message: "No password reset request found." });
      return;
    }

    if (!user.otp || user.otp !== otp) {
      res.status(400).json({ success: false, message: "Incorrect OTP." });
      return;
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      res.status(400).json({ success: false, message: "OTP has expired." });
      return;
    }

    user.password  = newPassword;
    user.otp       = undefined;
    user.otpExpiry = undefined;
    user.otpType   = undefined;
    await user.save();

    await sendPasswordChangedEmail(user.email, user.name);

    res.status(200).json({ success: true, message: "Password reset successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to reset password." });
  }
};


export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select("-password -otp -otpExpiry");
    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to get user." });
  }
};

// ── Change Password (step 1 — send OTP) ──────────────────────────────────────
export const requestPasswordChange = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    const otp       = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otp        = otp;
    user.otpExpiry  = otpExpiry;
    user.otpType    = "change-password";
    await user.save();

    await sendOTPEmail(user.email, user.name, otp, "change-password");

    res.status(200).json({ success: true, message: "OTP sent to your email." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to send OTP." });
  }
};

// ── Change Password (step 2 — verify OTP + update) ───────────────────────────
export const confirmPasswordChange = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { otp, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    if (user.otpType !== "change-password") {
      res.status(400).json({ success: false, message: "No password change request found." });
      return;
    }

    if (!user.otp || user.otp !== otp) {
      res.status(400).json({ success: false, message: "Incorrect OTP." });
      return;
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      res.status(400).json({ success: false, message: "OTP has expired." });
      return;
    }

    user.password   = newPassword;
    user.otp        = undefined;
    user.otpExpiry  = undefined;
    user.otpType    = undefined;
    await user.save();

    await sendPasswordChangedEmail(user.email, user.name);

    res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to change password." });
  }
};

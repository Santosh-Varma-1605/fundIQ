import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Investor from "../models/Investor.js";
import Startup from "../models/Startup.js";
import crypto from "crypto";
import { sendResetEmail, sendVerificationEmail } from "../utils/sendEmail.js";

/* Helper: choose model */
const getModel = (role) => {
  if (role === "investor") return Investor;
  if (role === "startup") return Startup;
  throw new Error("Invalid role");
};

/* REGISTER */
export const register = async (req, res) => {
  try {
    const { role } = req.params;
    const Model = getModel(role);

    let { firstName, lastName, email, password } = req.body;

    // ✅ normalize email
    email = email.toLowerCase().trim();

    const exists = await Model.findOne({ email });

    if (exists) {

      if (!exists.isVerified) {

        const token = crypto.randomBytes(32).toString("hex");

        exists.verifyToken = token;
        await exists.save();

        const verifyLink = `http://localhost:5000/api/auth/verify-email?token=${token}&role=${role}`;

        await sendVerificationEmail({
          to: email,
          verifyLink,
          role,
          firstName: exists.firstName
        });

        return res.json({
          success: false,
          resent: true,
          message: "Account exists but not verified. Verification email resent."
        });
      }

      return res.json({
        success: false,
        message: "Account already exists"
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const verifyToken = crypto.randomBytes(32).toString("hex");

    await Model.create({
      firstName,
      lastName,
      email,
      password: hashed,
      isVerified: false,
      verifyToken
    });

   const verifyLink = `http://localhost:5000/api/auth/verify-email?token=${verifyToken}&role=${role}`;

    await sendVerificationEmail({
      to: email,
      verifyLink,
      role,
      firstName
    });

    return res.json({
      success: true,
      message: "Verification email sent"
    });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
};
export const verifyEmail = async (req, res) => {
  try {
    const { token, role } = req.query;

    // ✅ Validate role
    if (!["investor", "startup"].includes(role)) {
      return res.redirect(`${process.env.FRONTEND_URL}/`);
    }

    const Model = getModel(role);

    const user = await Model.findOne({ verifyToken: token });

    if (!user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/${role}-login?verified=invalid`
      );
    }

    // ✅ Mark verified
    user.isVerified = true;
    user.verifyToken = undefined;

    await user.save();

    // ✅ Issue JWT
    const jwt_token = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET
    );

    res.cookie("token", jwt_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false
    });

    // ✅ Redirect
    const dashboard =
      role === "investor"
        ? `${process.env.FRONTEND_URL}/investor-dashboard`
        : `${process.env.FRONTEND_URL}/startup-dashboard`;

    return res.redirect(`${dashboard}?token=${jwt_token}`);

  } catch (err) {
    console.error("verifyEmail error:", err);
    return res.redirect(`${process.env.FRONTEND_URL}/`);
  }
};

/* LOGIN */
export const login = async (req, res) => {
  try {
    const { role } = req.params;

    // ✅ validate role
    if (!["investor", "startup"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const Model = getModel(role);

    let { email, password } = req.body;

    // ✅ normalize email
    email = email.toLowerCase().trim();

    const user = await Model.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    // 🔐 block unverified users
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        unverified: true,
        message: "Please verify your email before signing in."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password."
      });
    }

    const token = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false
    });

    return res.json({ success: true, token });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const { role } = req.params;

    const Model = role === "startup" ? Startup : Investor;

    const user = await Model.findOne({ email });

    if (!user) return res.json({ success: true });

    // rate limit (fixed logic)
    if (
      user.resetTokenExpiry &&
      (user.resetTokenExpiry - Date.now()) > 14 * 60 * 1000
    ) {
      return res.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}&role=${role}`;

    await sendResetEmail({
      to: email,
      resetLink,
      role,
      firstName: user.firstName,
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.json({ success: true });
  }
};
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const { role } = req.params;

    const Model = role === "startup" ? Startup : Investor;

    const user = await Model.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // validation
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    return res.json({
      success: true,
      message: "Password reset successful",
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
};
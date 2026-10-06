import express from "express";
import rateLimit from "express-rate-limit";
import { register, login, forgotPassword, resetPassword, verifyEmail } from "../controllers/authController.js";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = express.Router();

/* ── Rate limiters ── */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 attempts per IP
  message: { success: false, message: "Too many attempts. Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                    // max 5 reset requests per IP per hour
  message: { success: false, message: "Too many reset requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ── Normal auth ── */
router.post("/:role/register", authLimiter, register);
router.post("/:role/login",    authLimiter, login);
// verify route
router.get("/verify-email", authLimiter, verifyEmail);
/* ── Google OAuth ── */
router.get("/google", (req, res, next) => {
  // google role validation
const role = ["investor", "startup"].includes(req.query.role)
  ? req.query.role
  : "investor";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: role,
  })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    try {
      const token = jwt.sign(
        { id: req.user._id, role: req.user.role },
        process.env.JWT_SECRET
      );
      res.cookie("token", token, {
  httpOnly: true,
  sameSite: "lax",
  secure: false
});
      const base = process.env.FRONTEND_URL;
      const dest = req.user.role === "startup"
  ? `${base}/startup-dashboard`
  : `${base}/investor-dashboard`;
      return res.redirect(dest);
    } catch {
      res.redirect("http://localhost:5173/");
    }
  }
);

/* ── Password reset ── */
router.post("/:role/forgot-password", forgotLimiter, forgotPassword);
router.post("/:role/reset-password", resetLimiter, resetPassword);
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false
  });

  return res.json({ success: true });
});


export default router;
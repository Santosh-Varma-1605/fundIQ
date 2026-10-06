import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ✅ Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🔐 VERIFY EMAIL
export const sendVerificationEmail = async ({ to, verifyLink, role, firstName }) => {
  try {
    if (!to) return;

    console.log("Sending verification email to:", to);

    const roleLabel   = role === "investor" ? "Investor" : "Startup";
    const accentColor = role === "investor" ? "#6366f1"  : "#22c55e";

    await transporter.sendMail({
      from: `FundIQ <${process.env.EMAIL_USER}>`,
      to,
      subject: `Verify your FundIQ ${roleLabel} account`,
      text: `Verify your email: ${verifyLink}`,
      html: `
        <div style="font-family:'Inter',Arial,sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;color:#fff;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
          <div style="padding:32px">
            <h2>Verify your email</h2>
            <p>Hi ${firstName || "there"},</p>
            <p>Click below to verify your account:</p>
            <a href="${verifyLink}" style="display:inline-block;padding:12px 20px;background:${accentColor};color:#fff;border-radius:8px;text-decoration:none">
              Verify Email
            </a>
            <p style="margin-top:20px;font-size:12px;">Or copy: ${verifyLink}</p>
          </div>
        </div>
      `,
    });

    console.log("Verification email sent successfully");

  } catch (err) {
    console.error("Verification email error:", err);
  }
};

// 🔁 RESET PASSWORD
export const sendResetEmail = async ({ to, resetLink }) => {
  try {
    await transporter.sendMail({
      from: `FundIQ <${process.env.EMAIL_USER}>`,
      to,
      subject: "Reset your password",
      text: `Reset your password: ${resetLink}`,
      html: `
        <p>Click below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
      `,
    });

    console.log("Reset email sent");

  } catch (err) {
    console.error("Reset email error:", err);
  }
};
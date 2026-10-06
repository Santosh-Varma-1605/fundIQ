/**
 * routes/pitchCorrector.routes.js
 *
 * Mount in your app:
 *   import pitchCorrectorRoutes from "./routes/pitchCorrector.routes.js";
 *   app.use("/api/pitch", pitchCorrectorRoutes);
 */

import express        from "express";
import Groq           from "groq-sdk";
import StartupProfile from "../models/StartupProfile.js";
import { protect }    from "../middleware/authMiddleware.js";

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Formats a number into a human-readable financial string.
 * e.g. 1350000 → "$1.4M"
 */
const fmtMoney = (n) => {
  if (!n && n !== 0) return "not provided";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
};

/**
 * Serialises a StartupProfile document into a compact text block
 * that can be embedded in the system prompt.
 */
const buildProfileContext = (profile) => {
  if (!profile) return "No startup profile found for this user.";

  const growthPct =
    profile.growth_rate != null
      ? `${(profile.growth_rate * 100).toFixed(1)}%`
      : "not provided";

  return `
STARTUP PROFILE (use this to personalise pitch feedback):
- Name:           ${profile.startup_name  || "not provided"}
- Sector:         ${profile.sector        || "not provided"}
- Stage:          ${profile.stage         || "not provided"}
- Target Market:  ${profile.market        || "not provided"}
- HQ Country:     ${profile.hq_country    || "not provided"}
- Total Raised:   ${fmtMoney(profile.total_raised)}
- Current Raise:  ${fmtMoney(profile.current_raise)}
- Revenue:        ${fmtMoney(profile.revenue)}
- Growth Rate:    ${growthPct}
- Team Size:      ${profile.team_size     ?? "not provided"}
- Traction Score: ${profile.traction_score?.toFixed(2) ?? "not provided"} / 2.0
- Risk Score:     ${profile.risk_score?.toFixed(2)     ?? "not provided"} / 1.0
`.trim();
};

// ── Build system prompt ──────────────────────────────────────────────────────

const buildSystemPrompt = (profileContext) => `
You are an elite startup pitch coach embedded in FundIQ, an AI-powered investor-matching platform.

${profileContext}

Your job is to review, critique, and rewrite startup pitches so they resonate with investors.

When the user shares a pitch (or a section of one), always:

1. **Quick Diagnosis** — Identify the 2-3 most critical weaknesses in ≤3 bullet points.
2. **Rewritten Version** — Provide an improved version of the pitch (or the section shared). Mirror the founder's voice while making it sharper, more investor-ready, and data-driven where possible. If profile data is available, weave in specific figures (e.g. current raise amount, sector, stage) naturally.
3. **What Changed & Why** — Briefly explain the key edits and the investor psychology behind them.
4. **Next Steps** — One concrete action the founder should take before their next investor meeting.

Tone: direct, expert, encouraging. No fluff.
Keep the full response under 400 words unless the pitch is very long.
End with a one-line disclaimer.
`.trim();

// ── Route ────────────────────────────────────────────────────────────────────

/**
 * POST /api/pitch/chat
 *
 * Body: { messages: Array<{ role: "user"|"assistant", content: string }> }
 * Auth: Bearer token (optional — degrades gracefully if not logged in)
 */
router.post("/chat", protect, async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  // ── Fetch startup profile for the logged-in user ─────────────
  let profile = null;
  try {
    profile = await StartupProfile.findOne({ startupId: req.user.id });
  } catch (err) {
    // Non-fatal: continue without profile context
    console.warn("Could not fetch startup profile:", err.message);
  }

  const profileContext = buildProfileContext(profile);
  const systemPrompt   = buildSystemPrompt(profileContext);

  // ── Call Groq ────────────────────────────────────────────────
  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role:    m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      ],
      temperature: 0.65,   // slightly lower than advisor for more consistent rewrites
      max_tokens:  1024,
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error("Groq Error:", err);
    res.status(500).json({ error: "Groq request failed" });
  }
});

export default router;
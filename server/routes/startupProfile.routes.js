/**
 * routes/startupProfile.routes.js
 */

import express         from "express";
import StartupProfile  from "../models/StartupProfile.js";
import InvestorProfile from "../models/InvestorProfile.js";
import Match           from "../models/Match.js";
import { protect }     from "../middleware/authMiddleware.js";
import { matchStartup } from "../matching/matchEngine.js";

const router = express.Router();

// ── Helper: generate next startup_id e.g. "ST-0042" ───────────
async function generateStartupId() {
  const last = await StartupProfile
    .findOne({ startup_id: { $ne: null } })
    .sort({ startup_id: -1 })
    .select("startup_id");

  if (!last?.startup_id) return "ST-0001";

  const num = parseInt(last.startup_id.replace("ST-", ""), 10);
  return `ST-${String(num + 1).padStart(4, "0")}`;
}

// ── GET own profile ────────────────────────────────────────────
router.get("/profile", protect, async (req, res) => {
  try {
    const profile = await StartupProfile.findOne({ startupId: req.user.id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── CREATE / UPDATE own profile ────────────────────────────────
router.post("/profile", protect, async (req, res) => {
  try {
    const fields = [
      "startup_name", "sector", "stage", "market", "hq_country",
      "total_raised", "current_raise", "revenue", "growth_rate",
      "team_size", "traction_score", "risk_score", "email",
    ];
    const update = {};
    fields.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
    update.startupId = req.user.id;

    // Check if profile already exists
    const existing = await StartupProfile.findOne({ startupId: req.user.id });

    // Auto-assign startup_id if this is a new profile or id is missing
    if (!existing?.startup_id) {
      update.startup_id = await generateStartupId();
    }

    const profile = await StartupProfile.findOneAndUpdate(
      { startupId: req.user.id },
      { $set: update },
      { upsert: true, new: true }
    );

    // Embed + match in background (non-blocking)
    matchStartup(profile)
      .then(matches =>
        console.log(`[dynamic] ${profile.startup_id} matched with ${matches.length} investors`)
      )
      .catch(err =>
        console.error(`[matchStartup] ${profile.startup_id}:`, err.message)
      );

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET public profile by startup_id ──────────────────────────
router.get("/profile/:startup_id", async (req, res) => {
  try {
    const profile = await StartupProfile.findOne({
      startup_id: req.params.startup_id,
    });
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET top 10 investor picks for logged-in startup ────────────
router.get("/top-picks", protect, async (req, res) => {
  try {
    const myProfile = await StartupProfile.findOne({ startupId: req.user.id });
    if (!myProfile)
      return res.status(404).json({ message: "Profile not set up yet" });

    if (!myProfile.startup_id)
      return res.status(400).json({ message: "Profile incomplete — no startup_id assigned" });

    const matchDoc = await Match.findOne({ entity_id: myProfile.startup_id });
    if (!matchDoc)
      return res.status(404).json({ message: "Matches not ready yet. Please save your profile first." });

    const enriched = await Promise.all(
      matchDoc.matches.map(async (m) => {
        const ip = await InvestorProfile.findOne({ investor_id: m.match_id });
        return {
          similarity_score:  m.similarity_score,
          investor_id:       m.match_id,
          investor_name:     m.match_name,
          preferred_sectors: m.preferred_sectors,
          preferred_stage:   m.preferred_stage,
          geo_focus:         m.geo_focus,
          ...(ip ? ip.toObject() : {}),
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
/**
 * routes/investorProfile.routes.js
 */

import express         from "express";
import InvestorProfile from "../models/InvestorProfile.js";
import StartupProfile  from "../models/StartupProfile.js";
import Match           from "../models/Match.js";
import { protect }     from "../middleware/authMiddleware.js";
import { matchInvestor } from "../matching/matchEngine.js";

const router = express.Router();

// ── Helper: generate next investor_id e.g. "INV-0501" ─────────
async function generateInvestorId() {
  const last = await InvestorProfile
    .findOne({ investor_id: { $ne: null } })
    .sort({ investor_id: -1 })
    .select("investor_id");

  if (!last?.investor_id) return "INV-0001";

  const num = parseInt(last.investor_id.replace("INV-", ""), 10);
  return `INV-${String(num + 1).padStart(4, "0")}`;
}

// ── GET own profile ────────────────────────────────────────────
router.get("/profile", protect, async (req, res) => {
  try {
    const profile = await InvestorProfile.findOne({ investorId: req.user.id });
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
      "investor_name", "email", "preferred_sectors", "preferred_stages",
      "geo_focus", "check_min", "check_max", "risk_appetite",
      "avg_check_usd", "deals_per_year", "pre_revenue_ok", "thesis_text"
    ];
    const update = {};
    fields.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
    update.investorId = req.user.id;

    // Check if profile already exists
    const existing = await InvestorProfile.findOne({ investorId: req.user.id });

    // Auto-assign investor_id if this is a new profile or id is missing
    if (!existing?.investor_id) {
      update.investor_id = await generateInvestorId();
    }

    const profile = await InvestorProfile.findOneAndUpdate(
      { investorId: req.user.id },
      { $set: update },
      { upsert: true, new: true }
    );

    // Embed + match in background (non-blocking)
    matchInvestor(profile)
      .then(matches =>
        console.log(`[dynamic] ${profile.investor_id} matched with ${matches.length} startups`)
      )
      .catch(err =>
        console.error(`[matchInvestor] ${profile.investor_id}:`, err.message)
      );

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET public profile by investor_id ─────────────────────────
router.get("/profile/:investor_id", async (req, res) => {
  try {
    const profile = await InvestorProfile.findOne({
      investor_id: req.params.investor_id,
    });
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET top 10 startup picks for logged-in investor ────────────
router.get("/top-picks", protect, async (req, res) => {
  try {
    const myProfile = await InvestorProfile.findOne({ investorId: req.user.id });
    if (!myProfile)
      return res.status(404).json({ message: "Profile not set up yet" });

    if (!myProfile.investor_id)
      return res.status(400).json({ message: "Profile incomplete — no investor_id assigned" });

    const matchDoc = await Match.findOne({ entity_id: myProfile.investor_id });
    if (!matchDoc)
      return res.status(404).json({ message: "Matches not ready yet. Please save your profile first." });

    const enriched = await Promise.all(
      matchDoc.matches.map(async (m) => {
        const sp = await StartupProfile.findOne({ startup_id: m.match_id });
        return {
          similarity_score: m.similarity_score,
          startup_id:       m.match_id,
          startup_name:     m.match_name,
          sector:           m.sector,
          stage:            m.stage,
          market:           m.market,
          ...(sp ? sp.toObject() : {}),
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
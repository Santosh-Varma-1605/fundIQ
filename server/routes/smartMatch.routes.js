// GET /api/startup/feed   — ranked investor deck for the logged-in startup
// GET /api/investor/feed  — ranked startup deck for the logged-in investor
//
// No AI runs here. Candidates were precomputed offline; this route applies
// exclusions, tops up inventory if the user is running low, ranks what's
// left against live swipe state, and enriches the top slice.

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Match from "../models/Match.js";
import Connection from "../models/Connection.js";
import StartupProfile from "../models/StartupProfile.js";
import InvestorProfile from "../models/InvestorProfile.js";
import { feedRanker } from "../matching/feedRanker.js";
import { getActiveModel } from "../matching/modelStore.js";
import { extendCandidates } from "../matching/extendCandidates.js";

const router = express.Router();

const DEFAULT_LIMIT = 15;
const MAX_LIMIT     = 50;
const LOW_INVENTORY = 10; // top up when fewer unseen than this remain

function parseExclude(q) {
  if (!q) return new Set();
  return new Set(String(q).split(",").map((s) => s.trim()).filter(Boolean));
}

async function buildFeed({ req, res, entityType }) {
  const isStartup = entityType === "startup";
  const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, MAX_LIMIT);
  const clientExcluded = parseExclude(req.query.exclude);

  // 1. Who is asking
  const profile = isStartup
    ? await StartupProfile.findOne({ startupId: req.user.id })
    : await InvestorProfile.findOne({ investorId: req.user.id });

  if (!profile) {
    return res.status(404).json({ message: "Profile not found. Create your profile first." });
  }

  const myId = isStartup ? profile.startup_id : profile.investor_id;
  if (!myId) {
    return res.status(409).json({ message: "Profile is still being set up. Try again shortly." });
  }

  // 2. Precomputed candidates
  let matchDoc = await Match.findOne({ entity_id: myId });
  if (!matchDoc) {
    return res.json({ cards: [], exhausted: true, remaining: 0, poolDrained: true });
  }

  // 3. Already-connected counterparties never belong in the deck
  const connections = await Connection.find(
    isStartup ? { startupId: myId } : { investorId: myId }
  ).select("startupId investorId").lean();
  const connected = new Set(connections.map((c) => (isStartup ? c.investorId : c.startupId)));

  const isExcluded = (m) =>
    m.status === "interested" ||      // already liked — pending or connected
    connected.has(m.match_id) ||      // already matched
    clientExcluded.has(m.match_id);   // client already holds this card

  // 4. Top up if the user is running low on genuinely new cards.
  //    Only when the pool hasn't already been drained — otherwise every
  //    request would re-query Qdrant to be told "nothing more" again.
  const unseenCount = matchDoc.matches.filter(
    (m) => m.status === "unseen" && !isExcluded(m)
  ).length;

  if (unseenCount < LOW_INVENTORY && !matchDoc.candidates_exhausted) {
    try {
      const { appended, exhausted } = await extendCandidates(matchDoc, profile);
      if (exhausted) {
        await Match.updateOne({ entity_id: myId }, { $set: { candidates_exhausted: true } });
      }
      if (appended > 0) matchDoc = await Match.findOne({ entity_id: myId });
    } catch (err) {
      // Topping up is an enhancement, not a dependency — serve what we have.
      console.error("[feed] extendCandidates failed:", err.message);
    }
  }

  // 5. Rank what's left
  const eligible = matchDoc.matches.filter((m) => !isExcluded(m));
  if (!eligible.length) {
    return res.json({
      cards: [], exhausted: true, remaining: 0,
      poolDrained: Boolean(matchDoc.candidates_exhausted),
    });
  }

  const model  = await getActiveModel();
  const ranked = feedRanker(eligible, model);
  const page   = ranked.slice(0, limit);

  // 6. Enrich — one $in query, not one lookup per card
  const ids = page.map((m) => m.match_id);
  const profiles = isStartup
    ? await InvestorProfile.find({ investor_id: { $in: ids } }).lean()
    : await StartupProfile.find({ startup_id: { $in: ids } }).lean();

  const byId = new Map(
    profiles.map((p) => [isStartup ? p.investor_id : p.startup_id, p])
  );

  const cards = page.map((m) => {
    const p = byId.get(m.match_id) || {};
    return {
      match_id:         m.match_id,
      name: (isStartup ? p.investor_name : p.startup_name) || m.match_name || "",
      similarity_score: m.similarity_score,
      reciprocal_score: m.reciprocal_score,
      score:            m.finalScore,
      status:           m.status,
      // Honest labelling: this candidate is outside the user's stage focus
      // and only present because nothing eligible existed.
      stage_relaxed:    Boolean(m.stage_relaxed),
      resurfaced:       m.status === "passed",
      profile: isStartup
        ? {
            investor_id: p.investor_id, investor_name: p.investor_name, email: p.email,
            preferred_sectors: p.preferred_sectors, preferred_stages: p.preferred_stages,
            geo_focus: p.geo_focus, check_min: p.check_min, check_max: p.check_max,
            risk_appetite: p.risk_appetite, deals_per_year: p.deals_per_year,
            pre_revenue_ok: p.pre_revenue_ok, thesis_text: p.thesis_text,
          }
        : {
            startup_id: p.startup_id, startup_name: p.startup_name, email: p.email,
            sector: p.sector, stage: p.stage, market: p.market, hq_country: p.hq_country,
            total_raised: p.total_raised, current_raise: p.current_raise, revenue: p.revenue,
            growth_rate: p.growth_rate, team_size: p.team_size,
            traction_score: p.traction_score, risk_score: p.risk_score,
          },
    };
  });

  // 7. Record what was shown — fire and forget, never block the response.
  //    Phase 8's exploration layer needs this to find under-shown candidates.
  if (ids.length) {
    Match.updateOne(
      { entity_id: myId },
      { $set: { "matches.$[el].lastShownAt": new Date() } },
      { arrayFilters: [{ "el.match_id": { $in: ids } }] }
    ).catch((err) => console.error("[feed] lastShownAt update failed:", err.message));
  }

  return res.json({
    cards,
    remaining: Math.max(0, ranked.length - page.length),
    exhausted: ranked.length <= page.length,
    poolDrained: Boolean(matchDoc.candidates_exhausted),
    modelVersion: model?.version ?? null, // null = cold start
  });
}

router.get("/startup/feed", protect, async (req, res) => {
  try {
    await buildFeed({ req, res, entityType: "startup" });
  } catch (err) {
    console.error("[GET /startup/feed]", err);
    res.status(500).json({ message: "Failed to build feed" });
  }
});

router.get("/investor/feed", protect, async (req, res) => {
  try {
    await buildFeed({ req, res, entityType: "investor" });
  } catch (err) {
    console.error("[GET /investor/feed]", err);
    res.status(500).json({ message: "Failed to build feed" });
  }
});

export default router;
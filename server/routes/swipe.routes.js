// POST /api/swipe        — record a like/pass, detect mutual matches
// GET  /api/connections  — list mutual matches
//
// Three things happen per swipe, in order:
//   1. an Interaction row is appended (the Phase 7 training record)
//   2. the Match subdocument's swipe state is updated (what the feed reads)
//   3. on a like, the reverse direction is checked for a mutual match
//
// (1) is the durable log and (2) is a denormalised cache of it. If they
// ever disagree, (1) is the source of truth.

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Match from "../models/Match.js";
import Interaction from "../models/Interaction.js";
import Connection from "../models/Connection.js";
import StartupProfile from "../models/StartupProfile.js";
import InvestorProfile from "../models/InvestorProfile.js";
import { getActiveModel } from "../matching/modelStore.js";

const router = express.Router();

// A repeated identical swipe inside this window is treated as a double
// submit (double-tap, client retry) rather than a new decision. Longer
// than this and it is a genuine re-swipe on a resurfaced card, which we
// deliberately keep as a separate row — pass-then-like-weeks-later is
// exactly the signal the decay mechanic exists to produce.
const DUPLICATE_WINDOW_MS = 5000;

// Identify the caller without depending on the JWT payload's shape.
async function resolveActor(userId) {
  const sp = await StartupProfile.findOne({ startupId: userId });
  if (sp) return { profile: sp, type: "startup", id: sp.startup_id };

  const ip = await InvestorProfile.findOne({ investorId: userId });
  if (ip) return { profile: ip, type: "investor", id: ip.investor_id };

  return null;
}

router.post("/swipe", protect, async (req, res) => {
  try {
    const { targetId, action } = req.body || {};

    if (!targetId || typeof targetId !== "string") {
      return res.status(400).json({ message: "targetId is required" });
    }
    if (action !== "like" && action !== "pass") {
      return res.status(400).json({ message: "action must be 'like' or 'pass'" });
    }

    const actor = await resolveActor(req.user.id);
    if (!actor) {
      return res.status(404).json({ message: "Profile not found. Create your profile first." });
    }
    if (!actor.id) {
      return res.status(409).json({ message: "Profile is still being set up. Try again shortly." });
    }

    const targetType = actor.type === "startup" ? "investor" : "startup";

    // The target must be a real candidate in this user's deck — you can
    // only swipe on something you were actually shown.
    const matchDoc = await Match.findOne({ entity_id: actor.id });
    const entry = matchDoc?.matches?.find((m) => m.match_id === targetId);
    if (!entry) {
      return res.status(404).json({ message: "Candidate not found in your matches" });
    }

    // ── Double-submit guard ──────────────────────────────────────
    const recent = await Interaction.findOne({
      actorId: actor.id,
      targetId,
      createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    }).sort({ createdAt: -1 }).lean();

    if (recent && recent.action === action) {
      const existing = await findConnection(actor, targetId);
      return res.json({
        ok: true,
        duplicate: true,
        isMatch: Boolean(existing),
        connection: existing || null,
      });
    }

    // ── 1. Append the training record ────────────────────────────
    const model = await getActiveModel();

    // Snapshot the features as they were when this card was ranked.
    // Reading them back from Match at training time would be wrong — the
    // candidate's profile may change before the nightly job runs.
    const featureSnapshot = entry.features
      ? {
          cosineSim:       entry.features.cosineSim       ?? null,
          stageMatch:      entry.features.stageMatch      ?? null,
          geoMatch:        entry.features.geoMatch        ?? null,
          checkSizeFit:    entry.features.checkSizeFit    ?? null,
          riskAppetiteFit: entry.features.riskAppetiteFit ?? null,
          sectorMatch:     entry.features.sectorMatch     ?? null,
          reciprocalScore: entry.features.reciprocalScore ?? null,
        }
      : undefined;

    await Interaction.create({
      actorId:    actor.id,
      actorType:  actor.type,
      targetId,
      targetType,
      action,
      features:   featureSnapshot,
      modelVersion: model?.version ?? null,
    });

    // ── 2. Update the feed's view of this card ───────────────────
    const update =
      action === "like"
        ? { $set: { "matches.$[el].status": "interested" } }
        : {
            $set: { "matches.$[el].status": "passed", "matches.$[el].passedAt": new Date() },
            $inc: { "matches.$[el].passCount": 1 },
          };

    await Match.updateOne({ entity_id: actor.id }, update, {
      arrayFilters: [{ "el.match_id": targetId }],
    });

    // ── 3. Mutual match ──────────────────────────────────────────
    if (action !== "like") {
      return res.json({ ok: true, isMatch: false, connection: null });
    }

    // Latest-wins: if they liked us and later passed, that is not a match.
    const theirLatest = await Interaction.findOne({
      actorId: targetId,
      targetId: actor.id,
    }).sort({ createdAt: -1 }).lean();

    if (!theirLatest || theirLatest.action !== "like") {
      return res.json({ ok: true, isMatch: false, connection: null });
    }

    const startupId  = actor.type === "startup" ? actor.id : targetId;
    const investorId = actor.type === "startup" ? targetId : actor.id;

    // Upsert rather than create: if both sides like each other at the same
    // moment, both requests reach here and the unique index would reject
    // the second. Upsert makes the race harmless and idempotent.
    const connection = await Connection.findOneAndUpdate(
      { startupId, investorId },
      {
        $setOnInsert: {
          startupId,
          investorId,
          matchedAt: new Date(),
          sourceScore: entry.reciprocal_score ?? null,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    console.log(`[swipe] MUTUAL MATCH ${startupId} <-> ${investorId}`);

    return res.json({
      ok: true,
      isMatch: true,
      connection: {
        startupId: connection.startupId,
        investorId: connection.investorId,
        matchedAt: connection.matchedAt,
        sourceScore: connection.sourceScore,
      },
    });
  } catch (err) {
    console.error("[POST /swipe]", err);
    res.status(500).json({ message: "Failed to record swipe" });
  }
});

async function findConnection(actor, targetId) {
  const startupId  = actor.type === "startup" ? actor.id : targetId;
  const investorId = actor.type === "startup" ? targetId : actor.id;
  return Connection.findOne({ startupId, investorId }).lean();
}

// ── GET /api/connections ────────────────────────────────────────
router.get("/connections", protect, async (req, res) => {
  try {
    const actor = await resolveActor(req.user.id);
    if (!actor || !actor.id) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const isStartup = actor.type === "startup";
    const connections = await Connection.find(
      isStartup ? { startupId: actor.id } : { investorId: actor.id }
    ).sort({ matchedAt: -1 }).lean();

    const otherIds = connections.map((c) => (isStartup ? c.investorId : c.startupId));
    const profiles = isStartup
      ? await InvestorProfile.find({ investor_id: { $in: otherIds } }).lean()
      : await StartupProfile.find({ startup_id: { $in: otherIds } }).lean();

    const byId = new Map(
      profiles.map((p) => [isStartup ? p.investor_id : p.startup_id, p])
    );

    res.json(
      connections.map((c) => {
        const otherId = isStartup ? c.investorId : c.startupId;
        const p = byId.get(otherId) || {};
        return {
          match_id:    otherId,
          name:        (isStartup ? p.investor_name : p.startup_name) || "",
          email:       p.email || null,
          matchedAt:   c.matchedAt,
          sourceScore: c.sourceScore,
          profile:     p,
        };
      })
    );
  } catch (err) {
    console.error("[GET /connections]", err);
    res.status(500).json({ message: "Failed to load connections" });
  }
});

export default router;
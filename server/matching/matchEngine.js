import { embed }                          from "../embeddings/embedder.js";
import { startupToText, investorToText }  from "../embeddings/buildText.js";
import { searchInvestors, searchStartups, upsertVector } from "../embeddings/vectorStore.js";
import Match            from "../models/Match.js";
import InvestorProfile  from "../models/InvestorProfile.js";
import StartupProfile   from "../models/StartupProfile.js";
import { passesHardFilters, computeFeatures } from "./reciprocalScoring.js";

const CANDIDATE_LIMIT = 50;

// ── "ST-0042" → 42, "INV-0001" → 1  (Qdrant needs integer IDs) ─
export function numericId(id) {
  if (!id || typeof id !== "string") {
    throw new Error(`numericId received invalid id: ${JSON.stringify(id)}`);
  }
  return parseInt(id.replace(/\D/g, ""), 10);
}

// Sort by reciprocal score, falling back to raw similarity when scores tie.
function byScore(a, b) {
  return (b.reciprocal_score - a.reciprocal_score) || (b.similarity_score - a.similarity_score);
}

// Swipe state lives on matches[] but belongs to the USER, not to the matching
// run. Rebuilding the candidate list must not erase what they have already
// decided about those candidates — otherwise editing a profile resurrects
// every passed card as unseen and puts every liked card back in the deck.
async function loadPriorSwipeState(entityId) {
  const prior = await Match.findOne({ entity_id: entityId })
    .select("matches.match_id matches.status matches.passCount matches.passedAt matches.lastShownAt")
    .lean();

  return new Map(
    (prior?.matches || []).map((m) => [m.match_id, {
      status:      m.status      ?? "unseen",
      passCount:   m.passCount   ?? 0,
      passedAt:    m.passedAt    ?? null,
      lastShownAt: m.lastShownAt ?? null,
    }])
  );
}

// ── Match a startup against all investors ───────────────────────
export async function matchStartup(startupProfile) {
  if (!startupProfile.startup_id) {
    console.warn("[matchStartup] Skipping — no startup_id on profile:", startupProfile._id);
    return [];
  }

  const priorState = await loadPriorSwipeState(startupProfile.startup_id);

  const text   = startupToText(startupProfile);
  const vector = await embed(text);

  await upsertVector(
    "startups",
    numericId(startupProfile.startup_id),
    vector,
    {
      startup_id:    startupProfile.startup_id,
      startup_name:  startupProfile.startup_name  || "",
      sector:        startupProfile.sector         || "",
      stage:         startupProfile.stage          || "",
      market:        startupProfile.market         || "",
      revenue:       startupProfile.revenue        ?? 0,
      current_raise: startupProfile.current_raise  ?? 0,
    }
  );

  // Strict pass: stage + revenue enforced at retrieval time
  let results = await searchInvestors(vector, startupProfile, CANDIDATE_LIMIT);
  let stageRelaxed = false;

  // Fallback: no investor covers this stage at all (e.g. Growth / Late Stage
  // in the current seed data). Retry without the stage condition so the user
  // gets a labelled, lower-ranked feed instead of an empty one.
  if (results.length === 0) {
    results = await searchInvestors(vector, startupProfile, CANDIDATE_LIMIT, { skipStageFilter: true });
    stageRelaxed = true;
    console.warn(
      `[matchStartup] ${startupProfile.startup_id} (${startupProfile.stage || "no stage"}): ` +
      `no stage-eligible investors — relaxed to semantic-only, ${results.length} candidates`
    );
  }

  const scored = await Promise.all(
    results.map(async (r) => {
      const ip = await InvestorProfile.findOne({ investor_id: r.payload.investor_id });
      if (!ip) return null; // orphaned Qdrant payload, no live profile — drop

      if (!passesHardFilters(ip, startupProfile, { skipStage: stageRelaxed })) return null;

      const features = computeFeatures(ip, startupProfile, r.score);

      return {
        match_id:          r.payload.investor_id,
        match_name:        r.payload.investor_name        || "",
        similarity_score:  parseFloat(r.score.toFixed(4)),
        reciprocal_score:  parseFloat(features.reciprocalScore.toFixed(4)),
        features,
        stage_relaxed:     stageRelaxed,

        // Carry forward this user's existing decision about this candidate.
        // Absent for anyone newly appearing in the list, who correctly
        // defaults to unseen.
        ...(priorState.get(r.payload.investor_id) || {}),

        preferred_sectors: Array.isArray(r.payload.preferred_sectors)
          ? r.payload.preferred_sectors.join(", ")
          : r.payload.preferred_sectors || "",
        preferred_stage:   Array.isArray(r.payload.preferred_stages)
          ? r.payload.preferred_stages.join(", ")
          : r.payload.preferred_stages  || "",
        geo_focus:         r.payload.geo_focus || "",
      };
    })
  );

  const matches = scored.filter(Boolean).sort(byScore);

  await Match.findOneAndUpdate(
    { entity_id: startupProfile.startup_id },
    {
      $set: {
        entity_id:            startupProfile.startup_id,
        entity_type:          "startup",
        stage_relaxed:        stageRelaxed,
        retrieval_cursor:     results.length,   // RAW retrieved, not matches.length
        candidates_exhausted: false,            // a rebuild re-opens the pool
        matches,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  const carried = matches.filter((m) => m.status && m.status !== "unseen").length;
  console.log(
    `[matchStartup] ${startupProfile.startup_id} → ${matches.length} matches saved ` +
    `(${results.length} raw candidates, ${results.length - matches.length} dropped, ` +
    `${carried} swipe states carried${stageRelaxed ? ", STAGE RELAXED" : ""})`
  );
  return matches;
}

// ── Match an investor against all startups ──────────────────────
export async function matchInvestor(investorProfile) {
  if (!investorProfile.investor_id) {
    console.warn("[matchInvestor] Skipping — no investor_id on profile:", investorProfile._id);
    return [];
  }

  const priorState = await loadPriorSwipeState(investorProfile.investor_id);

  const text   = investorToText(investorProfile);
  const vector = await embed(text);

  await upsertVector(
    "investors",
    numericId(investorProfile.investor_id),
    vector,
    {
      investor_id:       investorProfile.investor_id    || "",
      investor_name:     investorProfile.investor_name  || "",
      preferred_sectors: investorProfile.preferred_sectors ?? [],
      preferred_stages:  investorProfile.preferred_stages  ?? [],
      geo_focus:         investorProfile.geo_focus         || "",
      check_min:         investorProfile.check_min         ?? 0,
      check_max:         investorProfile.check_max         ?? 0,
      pre_revenue_ok:    investorProfile.pre_revenue_ok    ?? false,
    }
  );

  let results = await searchStartups(vector, investorProfile, CANDIDATE_LIMIT);
  let stageRelaxed = false;

  if (results.length === 0) {
    results = await searchStartups(vector, investorProfile, CANDIDATE_LIMIT, { skipStageFilter: true });
    stageRelaxed = true;
    console.warn(
      `[matchInvestor] ${investorProfile.investor_id} ` +
      `(${(investorProfile.preferred_stages || []).join(", ") || "no stages"}): ` +
      `no stage-eligible startups — relaxed to semantic-only, ${results.length} candidates`
    );
  }

  // Full StartupProfile is fetched per candidate because backwardScore()
  // needs current_raise / risk_score / hq_country, none of which live in
  // the Qdrant payload.
  const scored = await Promise.all(
    results.map(async (r) => {
      const sp = await StartupProfile.findOne({ startup_id: r.payload.startup_id });
      if (!sp) return null;

      if (!passesHardFilters(investorProfile, sp, { skipStage: stageRelaxed })) return null;

      const features = computeFeatures(investorProfile, sp, r.score);

      return {
        match_id:         r.payload.startup_id   || "",
        match_name:       r.payload.startup_name || "",
        similarity_score: parseFloat(r.score.toFixed(4)),
        reciprocal_score: parseFloat(features.reciprocalScore.toFixed(4)),
        features,
        stage_relaxed:    stageRelaxed,

        ...(priorState.get(r.payload.startup_id) || {}),

        sector:           r.payload.sector       || "",
        stage:            r.payload.stage        || "",
        market:           r.payload.market       || "",
      };
    })
  );

  const matches = scored.filter(Boolean).sort(byScore);

  await Match.findOneAndUpdate(
    { entity_id: investorProfile.investor_id },
    {
      $set: {
        entity_id:            investorProfile.investor_id,
        entity_type:          "investor",
        stage_relaxed:        stageRelaxed,
        retrieval_cursor:     results.length,
        candidates_exhausted: false,
        matches,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  const carried = matches.filter((m) => m.status && m.status !== "unseen").length;
  console.log(
    `[matchInvestor] ${investorProfile.investor_id} → ${matches.length} matches saved ` +
    `(${results.length} raw candidates, ${results.length - matches.length} dropped, ` +
    `${carried} swipe states carried${stageRelaxed ? ", STAGE RELAXED" : ""})`
  );
  return matches;
}
// server/matching/feedRanker.js
//
// Request-time ranking. Reads the precomputed candidates already in
// Match.matches[] and re-scores them against live swipe state. Never
// touches Qdrant, never re-embeds — just arithmetic over stored fields,
// so GET /feed stays cheap as swipe volume grows.
//
// finalScore = MLScore(features) - passDecayPenalty + explorationBonus

const DECAY_DAYS          = 14;   // base suppression window after a pass
const BASE_PENALTY        = 0.35; // magnitude at the moment of passing
const MAX_PASS_MULTIPLIER = 3;    // repeat passes extend the window, capped

// ── Pass decay ──────────────────────────────────────────────────
// A passed candidate is demoted, never removed. The penalty starts at
// BASE_PENALTY and decays linearly to zero. Repeat passes widen the window
// (14 / 28 / 42 days) rather than deepening the penalty — that keeps the
// demotion bounded while still respecting "they said no again".
//
// Note this only orders candidates WITHIN the passed tier; the sort below
// keeps the whole tier below anything unseen regardless of penalty.
export function passDecayPenalty(entry, now = Date.now()) {
  if (entry.status !== "passed" || !entry.passedAt) return 0;

  const passCount  = Math.max(1, entry.passCount || 1);
  const windowDays = DECAY_DAYS * Math.min(passCount, MAX_PASS_MULTIPLIER);

  const daysSince = (now - new Date(entry.passedAt).getTime()) / 86_400_000;
  if (daysSince >= windowDays) return 0;

  const decay = 1 - daysSince / windowDays; // 1 at pass time -> 0 at window end
  return BASE_PENALTY * decay;
}

// ── Exploration (Phase 8 placeholder) ───────────────────────────
// Will inject a small boost for under-shown candidates so the ranker
// cannot calcify into a filter bubble. Returns 0 until then.
export function explorationBonus(/* entry */) {
  return 0;
}

// ── Feature resolution ──────────────────────────────────────────
export const FEATURE_NAMES = [
  "cosineSim", "stageMatch", "geoMatch", "checkSizeFit",
  "riskAppetiteFit", "sectorMatch", "reciprocalScore",
];

const finite = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

// Do NOT test `entry.features` for truthiness. An entry written before
// feature logging can come back either as `undefined` (a .lean() query
// returns raw BSON, no defaults applied) or as a fully-populated object
// of nulls (a hydrated doc may fill the nested path from its schema
// defaults). The second is truthy with nothing usable in it, so a
// truthiness check would accept it and hand every legacy candidate an
// identical score. Validate the values instead.
export function resolveFeatures(entry) {
  const raw = entry.features || {};
  const out = {};
  let populated = 0;

  for (const name of FEATURE_NAMES) {
    const v = finite(raw[name]);
    if (v !== null) { out[name] = v; populated++; }
  }

  // Nothing usable — fall back to the stored scalar score.
  if (populated === 0) {
    return { reciprocalScore: finite(entry.reciprocal_score) ?? 0, _legacy: true };
  }

  // Partially populated: backfill the one field cold start depends on.
  if (out.reciprocalScore === undefined) {
    out.reciprocalScore = finite(entry.reciprocal_score) ?? 0;
    out._partial = true;
  }

  return out;
}

// ── MLScore ─────────────────────────────────────────────────────
// model === null  -> cold start, reciprocalScore carries the ranking
// model !== null  -> sigmoid(weights · features + bias)
//
// Weights are keyed by feature NAME, so the set of features in play is
// read off the model itself rather than an array-position convention.
// A feature present in the model but missing from the vector scores 0
// rather than NaN-ing the whole candidate.
export function mlScore(features, model) {
  if (!model || !model.weights) {
    return features.reciprocalScore ?? 0;
  }

  let z = model.bias ?? 0;
  for (const [name, weight] of Object.entries(model.weights)) {
    z += weight * (features[name] ?? 0);
  }
  return 1 / (1 + Math.exp(-z));
}

// ── Feed ranker ─────────────────────────────────────────────────
// Pure function: takes stored match entries, returns them scored and
// sorted. Exclusions (interested, existing connections, client-held cards)
// are the caller's job — this only ranks what it is handed.
export function feedRanker(entries, model = null, now = Date.now()) {
  return entries
    .map((entry) => {
      const features = resolveFeatures(entry);

      const base       = mlScore(features, model);
      const penalty    = passDecayPenalty(entry, now);
      const explore    = explorationBonus(entry);
      const finalScore = base - penalty + explore;

      return {
        ...(entry.toObject ? entry.toObject() : entry),
        _base: parseFloat(base.toFixed(4)),
        _penalty: parseFloat(penalty.toFixed(4)),
        finalScore: parseFloat(finalScore.toFixed(4)),
      };
    })
    .sort((a, b) => {
      // Tier: a passed card never outranks one the user hasn't seen, however
      // long ago the pass was. Resurfacing happens because unseen candidates
      // ran out, not because a timer elapsed — which is what makes "appear
      // less, not gone" mean something while fresh candidates still exist.
      //
      // Keyed on status, NOT on _penalty > 0. Keying on the penalty makes the
      // tier evaporate after 14 days, and the originally top-ranked candidates
      // outscore anything retrieved later, so passes sweep the whole first
      // page back while unseen cards sit unshown.
      const aPassed = a.status === "passed";
      const bPassed = b.status === "passed";
      if (aPassed !== bPassed) return aPassed ? 1 : -1;

      return (b.finalScore - a.finalScore) ||
             (b.reciprocal_score - a.reciprocal_score) ||
             (b.similarity_score - a.similarity_score);
    });
}

export const RANKER_CONSTANTS = { DECAY_DAYS, BASE_PENALTY, MAX_PASS_MULTIPLIER };

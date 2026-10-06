// server/matching/reciprocalScoring.js
// Day 2 — FINAL. backwardScore(), computeFeatures(), reciprocalScore().
//
// Confirmed against real schemas/UI:
//  - current_raise (not total_raised) is the "ask" field           [confirmed]
//  - sector is a single string, preferred_sectors is an array      [confirmed]
//  - risk_score is 0–1, higher = riskier                            [confirmed]
//  - geo_focus is unconstrained free text; startup has BOTH
//    hq_country (free text) and market (fixed region dropdown)     [confirmed]
//  - stage is a controlled dropdown on both sides -> reliable enough
//    to be a HARD filter. geo_focus is free text -> too noisy to be
//    a hard filter, kept as a SOFT feature instead.                [Option B]

const GEO_ALWAYS_MATCH = ["global", "worldwide", "any", "all", "international"];

// ── Soft feature functions ──────────────────────────────────────

function computeGeoMatch(investorGeoFocus, startupMarket, startupHqCountry) {
  if (!investorGeoFocus) return 0;
  const geo = investorGeoFocus.trim().toLowerCase();
  if (GEO_ALWAYS_MATCH.some((g) => geo.includes(g))) return 1;

  const market = (startupMarket || "").trim().toLowerCase();
  const country = (startupHqCountry || "").trim().toLowerCase();

  const matchesMarket = market && (geo.includes(market) || market.includes(geo));
  const matchesCountry = country && (geo.includes(country) || country.includes(geo));

  return matchesMarket || matchesCountry ? 1 : 0;
}

function computeSectorMatch(investorPreferredSectors, startupSector) {
  if (!startupSector || !Array.isArray(investorPreferredSectors)) return 0;
  const sector = startupSector.trim().toLowerCase();
  return investorPreferredSectors.some((s) => s.trim().toLowerCase() === sector) ? 1 : 0;
}

function computeStageMatch(investorPreferredStages, startupStage) {
  if (!Array.isArray(investorPreferredStages) || investorPreferredStages.length === 0) return 1; // no preference stated = no restriction
  if (!startupStage) return 0;
  const stage = startupStage.trim().toLowerCase();
  return investorPreferredStages.some((s) => s.trim().toLowerCase() === stage) ? 1 : 0;
}

function computeCheckSizeFit(checkMin, checkMax, currentRaise) {
  if (currentRaise == null || checkMin == null || checkMax == null) return 0;
  if (currentRaise < checkMin || currentRaise > checkMax) {
    const range = checkMax - checkMin || 1;
    const distance = currentRaise < checkMin ? checkMin - currentRaise : currentRaise - checkMax;
    return Math.max(0, 1 - distance / range); // soft falloff just outside range
  }
  return 1;
}

// risk_score confirmed 0–1, higher = riskier
function riskRangeForAppetite(appetite) {
  switch (appetite) {
    case "Low": return [0, 0.33];
    case "Medium": return [0.34, 0.66];
    case "High": return [0.67, 1];
    default: return [0, 1];
  }
}

function computeRiskAppetiteFit(appetite, riskScore) {
  if (riskScore == null) return 0.5; // unknown — don't penalize hard
  const [lo, hi] = riskRangeForAppetite(appetite);
  if (riskScore >= lo && riskScore <= hi) return 1;
  const distance = riskScore < lo ? lo - riskScore : riskScore - hi;
  return Math.max(0, 1 - distance / 0.5); // decays over a 0.5-point gap on a 0–1 scale
}

// ── Hard filters ─────────────────────────────────────────────────
// Only stage is enforced hard — it's drawn from the same controlled
// dropdown list on both sides (STAGES), so a mismatch is unambiguous.
// geo_focus is free text and stays a soft feature (see computeGeoMatch)
// to avoid rejecting real matches on typing/phrasing differences
// ("APAC" vs "Asia Pacific", "Delhi" vs "India").
function passesHardFilters(investor, startup, opts = {}) {
  if (investor.pre_revenue_ok === false && !(startup.revenue > 0)) return false;

  if (!opts.skipStage) {
    const hasStagePref = Array.isArray(investor.preferred_stages) && investor.preferred_stages.length > 0;
    if (hasStagePref && !computeStageMatch(investor.preferred_stages, startup.stage)) return false;
  }

  return true;
}

// ── Backward score: rule-based fit, no second embedding pass ────
function backwardScore(base) {
  const { stageMatch, geoMatch, checkSizeFit, riskAppetiteFit, sectorMatch } = base;
  return (stageMatch + geoMatch + checkSizeFit + riskAppetiteFit + sectorMatch) / 5;
}

function harmonicMean(a, b) {
  if (a <= 0 || b <= 0) return 0;
  return (2 * a * b) / (a + b);
}

// ── Full feature vector ─────────────────────────────────────────
// This is exactly what gets logged per swipe (Day 4) and later fed to
// MLScore(features) once Phase 7's learned ranker exists.
// reciprocalScore lives INSIDE this vector, not added again on top of
// it separately — avoids the double-counting caught earlier.
function computeFeatures(investor, startup, cosineSim) {
  const base = {
    cosineSim,
    stageMatch: computeStageMatch(investor.preferred_stages, startup.stage),
    geoMatch: computeGeoMatch(investor.geo_focus, startup.market, startup.hq_country),
    checkSizeFit: computeCheckSizeFit(investor.check_min, investor.check_max, startup.current_raise),
    riskAppetiteFit: computeRiskAppetiteFit(investor.risk_appetite, startup.risk_score),
    sectorMatch: computeSectorMatch(investor.preferred_sectors, startup.sector),
  };
  const backward = backwardScore(base);
  const reciprocalScore = harmonicMean(cosineSim, backward);
  return { ...base, reciprocalScore };
}

// ── Cold-start MLScore fallback ──────────────────────────────────
// Used directly as finalScore's MLScore(features) term until Phase 7
// trains real weights on logged Interaction data.
function coldStartScore(features) {
  return features.reciprocalScore;
}

export {
  passesHardFilters,
  computeFeatures,
  computeGeoMatch,
  computeSectorMatch,
  computeStageMatch,
  computeCheckSizeFit,
  computeRiskAppetiteFit,
  backwardScore,
  harmonicMean,
  coldStartScore,
};
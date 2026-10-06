import RankerModel from "../models/RankerModel.js";

const TTL_MS = 5 * 60 * 1000; // 5 min — a new model goes live within this

let cached = null;
let cachedAt = 0;

// Returns the active model, or null when none has been trained yet.
// null is the normal state until Phase 7 — mlScore() treats it as the
// cold-start signal and falls back to reciprocalScore.
export async function getActiveModel() {
  if (Date.now() - cachedAt < TTL_MS) return cached;

  try {
    cached = await RankerModel.findOne({ active: true }).sort({ version: -1 }).lean();
  } catch (err) {
    // Never let a model lookup break the feed — degrade to cold start.
    console.error("[modelStore] lookup failed, falling back to cold start:", err.message);
    cached = null;
  }
  cachedAt = Date.now();
  return cached;
}

// Call after training writes a new active model, so it goes live
// immediately instead of waiting out the TTL.
export function invalidateModelCache() {
  cached = null;
  cachedAt = 0;
}
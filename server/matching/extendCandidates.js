// server/matching/extendCandidates.js
//
// Pulls the NEXT tranche of candidates from Qdrant when a user is running
// low on unswiped cards.
//
// Match.matches[] is a cache of the top slice of the eligible pool, not
// the whole pool. A Series A startup has ~198 eligible investors but only
// the top 50 were ever retrieved — without this, the other ~148 are
// unreachable and the feed falls back to resurfacing passes long before
// the user has actually seen everyone.
//
// Reuses the vector already stored in Qdrant rather than re-embedding, so
// this stays off the expensive path even though it runs mid-request.
//
// PAGINATION: the offset comes from retrieval_cursor (raw results examined),
// NOT matches.length (results accepted). Those differ by whatever the hard
// filters rejected. Using matches.length would re-examine results already
// tested and — worse — would never advance at all when a tranche appends
// nothing, since the offset is derived from a count that didn't change.

import { qdrant, searchInvestors, searchStartups } from "../embeddings/vectorStore.js";
import InvestorProfile from "../models/InvestorProfile.js";
import StartupProfile from "../models/StartupProfile.js";
import Match from "../models/Match.js";
import { numericId } from "./matchEngine.js";
import { passesHardFilters, computeFeatures } from "./reciprocalScoring.js";

const TRANCHE_SIZE          = 50;  // raw results pulled per attempt
const MAX_ATTEMPTS          = 3;   // keep going past empty-after-filter batches
export const MAX_CANDIDATES = 200; // hard ceiling on matches[] growth

// Fetch the entity's own stored vector back out of Qdrant.
// Cheaper than re-running the embedding model on the request path.
async function getStoredVector(collection, id) {
  const points = await qdrant.retrieve(collection, {
    ids: [numericId(id)],
    with_vector: true,
    with_payload: false,
  });
  return points?.[0]?.vector ?? null;
}

// Score one raw Qdrant hit into a matches[] entry, or null if it should be
// dropped (duplicate, orphaned payload, or fails the hard filters).
// Extracted so the retry loop can reuse it.
async function scoreCandidate(r, { isStartup, profile, skipStage, existing }) {
  const otherId = isStartup ? r.payload.investor_id : r.payload.startup_id;
  if (!otherId || existing.has(otherId)) return null; // dedupe

  const other = isStartup
    ? await InvestorProfile.findOne({ investor_id: otherId })
    : await StartupProfile.findOne({ startup_id: otherId });
  if (!other) return null; // orphaned Qdrant payload, no live profile

  const [investor, startup] = isStartup ? [other, profile] : [profile, other];
  if (!passesHardFilters(investor, startup, { skipStage })) return null;

  const features = computeFeatures(investor, startup, r.score);

  const base = {
    match_id:         otherId,
    similarity_score: parseFloat(r.score.toFixed(4)),
    reciprocal_score: parseFloat(features.reciprocalScore.toFixed(4)),
    features,
    stage_relaxed:    skipStage,
    status:           "unseen",
    passCount:        0,
    passedAt:         null,
    lastShownAt:      null,
  };

  return isStartup
    ? {
        ...base,
        match_name: r.payload.investor_name || "",
        preferred_sectors: Array.isArray(r.payload.preferred_sectors)
          ? r.payload.preferred_sectors.join(", ") : (r.payload.preferred_sectors || ""),
        preferred_stage: Array.isArray(r.payload.preferred_stages)
          ? r.payload.preferred_stages.join(", ") : (r.payload.preferred_stages || ""),
        geo_focus: r.payload.geo_focus || "",
      }
    : {
        ...base,
        match_name: r.payload.startup_name || "",
        sector: r.payload.sector || "",
        stage:  r.payload.stage  || "",
        market: r.payload.market || "",
      };
}

// Returns { appended, exhausted, reason, cursor }
export async function extendCandidates(matchDoc, profile) {
  const isStartup = matchDoc.entity_type === "startup";
  const skipStage = matchDoc.stage_relaxed === true;
  const existing  = new Set(matchDoc.matches.map((m) => m.match_id));

  if (matchDoc.matches.length >= MAX_CANDIDATES) {
    return { appended: 0, exhausted: false, reason: "cap_reached", cursor: matchDoc.retrieval_cursor ?? 0 };
  }

  const vector = await getStoredVector(
    isStartup ? "startups" : "investors",
    matchDoc.entity_id
  );
  if (!vector) {
    console.warn(`[extendCandidates] no stored vector for ${matchDoc.entity_id}`);
    return { appended: 0, exhausted: false, reason: "no_vector", cursor: matchDoc.retrieval_cursor ?? 0 };
  }

  // Fall back to matches.length only for documents written before
  // retrieval_cursor existed. Imprecise but monotonic, and it self-corrects
  // on the next rebuildAllMatches run.
  let cursor    = matchDoc.retrieval_cursor ?? matchDoc.matches.length;
  let held      = matchDoc.matches.length;
  let appended  = 0;
  let exhausted = false;
  let reason    = "ok";

  // Retry across batches that filter down to nothing. A batch where every
  // result was a duplicate or failed the filters says nothing about results
  // further down the list, so it must not end the search.
  for (let attempt = 0; attempt < MAX_ATTEMPTS && appended === 0; attempt++) {
    const searchOpts = { offset: cursor, skipStageFilter: skipStage };

    const raw = isStartup
      ? await searchInvestors(vector, profile, TRANCHE_SIZE, searchOpts)
      : await searchStartups(vector, profile, TRANCHE_SIZE, searchOpts);

    // Advance by what was EXAMINED, always. This is what guarantees forward
    // progress even when a whole tranche is filtered away.
    cursor += raw.length;

    // Fewer results than requested means Qdrant has genuinely reached the
    // end of the eligible pool. That is the ONLY sound evidence of
    // exhaustion — an empty-after-filter batch is not.
    const atEnd = raw.length < TRANCHE_SIZE;

    if (raw.length) {
      const scored = await Promise.all(
        raw.map((r) => scoreCandidate(r, { isStartup, profile, skipStage, existing }))
      );

      const room  = MAX_CANDIDATES - held;
      const fresh = scored.filter(Boolean).slice(0, Math.max(0, room));

      if (fresh.length) {
        await Match.updateOne(
          { entity_id: matchDoc.entity_id },
          { $push: { matches: { $each: fresh } } }
        );
        fresh.forEach((f) => existing.add(f.match_id)); // guard the next attempt
        appended += fresh.length;
        held     += fresh.length;
      }
    }

    if (atEnd) { exhausted = true; reason = "pool_drained"; break; }
    if (held >= MAX_CANDIDATES) { reason = "cap_reached"; break; }
  }

  if (!appended && !exhausted) reason = "no_new_after_attempts";

  // Persist the cursor even when nothing was appended — otherwise the next
  // call issues the identical query and the search never moves forward.
  await Match.updateOne(
    { entity_id: matchDoc.entity_id },
    { $set: { retrieval_cursor: cursor, ...(exhausted ? { candidates_exhausted: true } : {}) } }
  );

  console.log(
    `[extendCandidates] ${matchDoc.entity_id} +${appended} | held ${held} | cursor ${cursor} | ${reason}`
  );
  return { appended, exhausted, reason, cursor };
}
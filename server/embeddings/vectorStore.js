import { QdrantClient } from "@qdrant/js-client-rest";

export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY,
});

const VECTOR_SIZE = 384;

// ── Create collections if they don't exist ──────────────────────
export async function ensureCollections() {
  for (const name of ["startups", "investors"]) {
    try {
      await qdrant.createCollection(name, {
        vectors: { size: VECTOR_SIZE, distance: "Cosine" },
      });
      console.log(`Qdrant collection created: ${name}`);
    } catch {
      // Already exists — ignore
    }
  }

  // Payload indexes — required for the filter conditions below to work
  await qdrant.createPayloadIndex("investors", { field_name: "preferred_stages", field_schema: "keyword" }).catch(() => {});
  await qdrant.createPayloadIndex("investors", { field_name: "pre_revenue_ok",    field_schema: "bool"    }).catch(() => {});
  await qdrant.createPayloadIndex("startups",  { field_name: "stage",             field_schema: "keyword" }).catch(() => {});
  await qdrant.createPayloadIndex("startups",  { field_name: "revenue",           field_schema: "float"   }).catch(() => {});
}

// ── Upsert a single vector with metadata payload ────────────────
export async function upsertVector(collection, id, vector, payload) {
  await qdrant.upsert(collection, {
    points: [{ id, vector, payload }],
  });
}

// ── Delete a vector by numeric id ──────────────────────────────
export async function deleteVector(collection, id) {
  await qdrant.delete(collection, { points: [id] });
}

// ── Search investors for a startup ─────────────────────────────
// Pure retrieval + hard filters only. All scoring/ranking lives in
// reciprocalScoring.js / matchEngine.js — exactly one home for it.
//
// Hard filters run AT RETRIEVAL TIME so the top `limit` comes from the
// full eligible pool, not from a post-hoc slice of pure semantic matches.
//
// opts.skipStageFilter — drops the stage condition. Used only by the
// matchEngine fallback when the strict query returned zero candidates
// (e.g. a Growth-stage startup when no investor covers Growth), so the
// user gets a degraded-but-labelled feed instead of a dead one.
export async function searchInvestors(startupVector, startup, limit = 50, opts = {}) {
  const must = [];

  if (startup.stage && !opts.skipStageFilter) {
    must.push({
      should: [
        { key: "preferred_stages", match: { value: startup.stage } },
        { is_empty: { key: "preferred_stages" } },
      ],
    });
  }

  // Only constrains anything when the startup is pre-revenue: then only
  // investors willing to do pre-revenue are eligible. A startup with
  // revenue excludes nobody on this basis, so the condition is skipped.
  if (!((startup.revenue ?? 0) > 0)) {
    must.push({ key: "pre_revenue_ok", match: { value: true } });
  }

  return qdrant.search("investors", {
    vector: startupVector,
    limit,
    offset: opts.offset || 0, 

    with_payload: true,
    filter: must.length ? { must } : undefined,
  });
}

// ── Search startups for an investor ────────────────────────────
export async function searchStartups(investorVector, investor, limit = 50, opts = {}) {
  const must = [];
  const stages = Array.isArray(investor.preferred_stages)
    ? investor.preferred_stages.filter(Boolean)
    : [];

  // No stage preference set = no restriction
  if (stages.length > 0 && !opts.skipStageFilter) {
    must.push({ key: "stage", match: { any: stages } });
  }

  if (investor.pre_revenue_ok !== true) {
    must.push({ key: "revenue", range: { gt: 0 } });
  }

  return qdrant.search("startups", {
    vector: investorVector,
    limit,
    offset: opts.offset || 0, 
    with_payload: true,
    filter: must.length ? { must } : undefined,
  });
}
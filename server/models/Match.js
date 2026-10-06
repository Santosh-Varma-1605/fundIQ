// server/models/Match.js
import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
  entity_id: { type: String, required: true, unique: true },
  // "INV-0001" or "ST-0001"

  entity_type: { type: String, enum: ["investor", "startup"], required: true },

  stage_relaxed: { type: Boolean, default: false }, // doc-level: whole list built under the fallback

  // How many RAW Qdrant results have been examined for this entity — NOT how
  // many were accepted. matches.length undercounts by whatever the hard
  // filters rejected, and using it as an offset would re-examine results
  // already tested and, when a tranche appends nothing, never advance at all.
  retrieval_cursor: { type: Number, default: 0 },

  // Set only when Qdrant returns fewer results than requested, i.e. the pool
  // is genuinely at its end. A batch that filters down to zero is NOT
  // evidence of this — later results may still be eligible.
  candidates_exhausted: { type: Boolean, default: false },

  matches: [
    {
      match_id: String,        // "ST-0315" or "INV-0424"
      match_name: String,
      similarity_score: Number,                          // raw Qdrant cosine score
      reciprocal_score: { type: Number, default: null }, // harmonic-mean score — what matches[] is sorted by

      // Full feature vector, logged at match time — the Phase 7 training data
      features: {
        cosineSim:       { type: Number, default: null },
        stageMatch:      { type: Number, default: null },
        geoMatch:        { type: Number, default: null },
        checkSizeFit:    { type: Number, default: null },
        riskAppetiteFit: { type: Number, default: null },
        sectorMatch:     { type: Number, default: null },
        reciprocalScore: { type: Number, default: null },
      },

      stage_relaxed: { type: Boolean, default: false }, // per-entry, for UI labelling

      // startup match extra fields
      sector: String,
      stage: String,
      market: String,

      // investor match extra fields
      preferred_sectors: String,
      preferred_stage: String,
      geo_focus: String,

      // Smart Match swipe state
      status: { type: String, enum: ["unseen", "passed", "interested"], default: "unseen" },
      passCount: { type: Number, default: 0 },
      passedAt: { type: Date, default: null },
      lastShownAt: { type: Date, default: null },
    }
  ],

}, { timestamps: true });

export default mongoose.model("Match", matchSchema);
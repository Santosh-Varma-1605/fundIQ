import mongoose from "mongoose";

// An append-only event log — one row per swipe, not one per pair.
// A user who passes, sees the candidate resurface weeks later, then likes
// them is exactly the signal the decay mechanic exists to produce, so
// overwriting would throw away the most interesting training rows.
// Anything asking "what does this user currently think of X" sorts by
// createdAt and takes the newest.
const interactionSchema = new mongoose.Schema({
  actorId:    { type: String, required: true, index: true },  // "ST-0001"
  actorType:  { type: String, enum: ["startup", "investor"], required: true },
  targetId:   { type: String, required: true, index: true },   // "INV-0081"
  targetType: { type: String, enum: ["startup", "investor"], required: true },
  action:     { type: String, enum: ["like", "pass"], required: true },

  // Feature snapshot AT SWIPE TIME — the training row for Phase 7.
  // Snapshotted rather than read back from Match later, because the
  // candidate's profile may change before training runs.
  features: {
    cosineSim:       { type: Number, default: null },
    stageMatch:      { type: Number, default: null },
    geoMatch:        { type: Number, default: null },
    checkSizeFit:    { type: Number, default: null },
    riskAppetiteFit: { type: Number, default: null },
    sectorMatch:     { type: Number, default: null },
    reciprocalScore: { type: Number, default: null },
  },

  // Which ranker ordered the deck when this swipe happened. null = cold
  // start. Free to record now, awkward to reconstruct later.
  modelVersion: { type: Number, default: null },
}, { timestamps: true });

interactionSchema.index({ actorId: 1, targetId: 1, createdAt: -1 });

export default mongoose.model("Interaction", interactionSchema);
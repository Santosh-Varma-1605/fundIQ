import mongoose from "mongoose";

// A trained logistic regression is just its weights — no pickle, no model
// server. "Deploying" a model = writing one of these documents.
const rankerModelSchema = new mongoose.Schema({
  version:   { type: Number, required: true, unique: true },
  trainedAt: { type: Date,   default: Date.now },
  active:    { type: Boolean, default: false, index: true },

  // Keyed by feature NAME, not array position — so a reordering in
  // computeFeatures() can never silently misalign a weight.
  // These keys MUST match computeFeatures() output exactly.
  weights: {
    cosineSim:       { type: Number, default: 0 },
    stageMatch:      { type: Number, default: 0 },
    geoMatch:        { type: Number, default: 0 },
    checkSizeFit:    { type: Number, default: 0 },
    riskAppetiteFit: { type: Number, default: 0 },
    sectorMatch:     { type: Number, default: 0 },
    reciprocalScore: { type: Number, default: 0 },
  },
  bias: { type: Number, default: 0 },

  trainingSize: { type: Number, default: 0 }, // interactions trained on
  notes:        { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("RankerModel", rankerModelSchema);
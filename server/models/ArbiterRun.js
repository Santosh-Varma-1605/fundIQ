import mongoose from "mongoose";
const { Schema } = mongoose;

const DebateTurnSchema = new Schema(
  {
    agent: { type: String, enum: ["analyst", "advocate", "skeptic", "arbiter"], required: true },
    round: { type: Number, required: true },
    content: { type: String, required: true },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const MarketBriefSchema = new Schema(
  {
    sectorTrend: { type: String, default: "" },
    comparableRaises: { type: [String], default: [] },
    notableNews: { type: [String], default: [] },
    generatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const VerdictSchema = new Schema(
  {
    score: { type: Number, min: 0, max: 100, required: true },
    confidence: { type: String, enum: ["low", "medium", "high"], required: true },
    summary: { type: String, required: true },
    targetSectors: { type: [String], default: [] },
    unresolvedRisks: { type: [String], default: [] },
    recommendedAdjustments: { type: [String], default: [] },
    whatWouldChangeTheVerdict: { type: [String], default: [] },
  },
  { _id: false }
);

const FollowUpTurnSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    askedBy: { type: String, required: true },
  },
  { _id: false, timestamps: { createdAt: "askedAt", updatedAt: false } }
);

const ArbiterRunSchema = new Schema(
  {
    runId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    role: { type: String, enum: ["investor", "startup"], required: true },
    input: { type: Schema.Types.Mixed, required: true },
    marketContext: { type: MarketBriefSchema, default: null },
    transcript: { type: [DebateTurnSchema], default: [] },
    verdict: { type: VerdictSchema, default: null },
    status: { type: String, enum: ["running", "complete", "failed"], default: "running", index: true },
    errorMessage: { type: String, default: null },
    followUps: { type: [FollowUpTurnSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("ArbiterRun", ArbiterRunSchema);
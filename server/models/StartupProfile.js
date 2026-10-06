import mongoose from "mongoose";

const startupProfileSchema = new mongoose.Schema({
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Startup",
    unique: true,
    required: true,
  },
  startup_id: { type: String, unique: true, required: true },
  startup_name: { type: String },
  email: { type: String },
  sector: { type: String },
  stage: { type: String },
  market: { type: String },
  hq_country: { type: String },
  total_raised: { type: Number },
  current_raise: { type: Number },
  revenue: { type: Number },
  growth_rate: { type: Number },
  team_size: { type: Number },
  traction_score: { type: Number },
  risk_score: { type: Number },
}, { timestamps: true });

export default mongoose.model("StartupProfile", startupProfileSchema);
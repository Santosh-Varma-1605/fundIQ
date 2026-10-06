import mongoose from "mongoose";

const investorProfileSchema = new mongoose.Schema({
  investorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Investor",
    unique: true,
    required: true,
  },
  investor_id: { type: String, unique: true, required: true }, // e.g. "INV-0001"
  investor_name: { type: String },
  email: { type: String },
  preferred_sectors: { type: [String], default: [] }, // e.g. ["Fintech", "SaaS"]
  preferred_stages: { type: [String], default: [] },  // e.g. ["Series A", "Seed"]
  geo_focus: { type: String },
  check_min: { type: Number },
  check_max: { type: Number },
  risk_appetite: { type: String, enum: ["Low", "Medium", "High"] },
  avg_check_usd: { type: Number },
  deals_per_year: { type: Number },
  pre_revenue_ok: { type: Boolean, default: false },
  thesis_text: { type: String },
}, { timestamps: true });

export default mongoose.model("InvestorProfile", investorProfileSchema);
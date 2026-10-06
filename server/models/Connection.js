import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema({
  startupId:   { type: String, required: true, index: true },  // "ST-0001"
  investorId:  { type: String, required: true, index: true },  // "INV-0081"
  matchedAt:   { type: Date, default: Date.now },
  sourceScore: { type: Number, default: null }, // reciprocal score at match time
}, { timestamps: true });

connectionSchema.index({ startupId: 1, investorId: 1 }, { unique: true });

export default mongoose.model("Connection", connectionSchema);
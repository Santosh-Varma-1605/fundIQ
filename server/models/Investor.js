import mongoose from "mongoose";

const investorSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
   isVerified:  { type: Boolean, default: false },
  verifyToken: { type: String },
  resetToken: String,
resetTokenExpiry: Date,
}, { timestamps: true });

export default mongoose.model("Investor", investorSchema);
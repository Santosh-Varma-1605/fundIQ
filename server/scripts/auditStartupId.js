// server/scripts/auditStartupId.js
import "dotenv/config";
import mongoose from "mongoose";
import StartupProfile from "../models/StartupProfile.js";

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const missing = await StartupProfile.find({
    $or: [{ startup_id: null }, { startup_id: { $exists: false } }],
  }).select("_id startupId email");

  console.log(`StartupProfile docs missing startup_id: ${missing.length}`);
  missing.forEach((d) => console.log(`  - ${d._id} / ${d.email || "no email"}`));

  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
// server/scripts/auditMatchDb.js
// Read-only audit — makes zero writes. Run: node server/scripts/auditMatchDb.js

import "dotenv/config";
import mongoose from "mongoose";
import InvestorProfile from "../models/InvestorProfile.js";
import Match from "../models/Match.js";

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Running audit (no writes will be made)...\n");

  // 1. investor_id missing/null check
  const missingInvestorId = await InvestorProfile.find({
    $or: [{ investor_id: null }, { investor_id: { $exists: false } }],
  }).select("_id investorId email");

  console.log(`=== investor_id audit ===`);
  console.log(`InvestorProfile docs missing investor_id: ${missingInvestorId.length}`);
  if (missingInvestorId.length > 0) {
    console.log("Affected docs (_id / email):");
    missingInvestorId.forEach((d) => console.log(`  - ${d._id} / ${d.email || "no email"}`));
  }

  // 2. match_id duplicates within a single entity's matches[] array
  console.log(`\n=== match_id duplication audit ===`);
  const allMatches = await Match.find({}).select("entity_id entity_type matches.match_id");

  let docsWithDupes = 0;
  let totalDupeGroups = 0;

  for (const doc of allMatches) {
    const ids = doc.matches.map((m) => m.match_id).filter(Boolean);
    const counts = {};
    for (const id of ids) counts[id] = (counts[id] || 0) + 1;

    const dupes = Object.entries(counts).filter(([, count]) => count > 1);
    if (dupes.length > 0) {
      docsWithDupes++;
      totalDupeGroups += dupes.length;
      console.log(
        `  - ${doc.entity_type} ${doc.entity_id}: ${dupes.length} duplicated match_id(s) -> ${dupes
          .map(([id, count]) => `${id} (x${count})`)
          .join(", ")}`
      );
    }
  }

  console.log(`\nTotal Match docs scanned: ${allMatches.length}`);
  console.log(`Match docs with at least one duplicate match_id: ${docsWithDupes}`);
  console.log(`Total duplicate match_id groups found: ${totalDupeGroups}`);

  console.log(`\n=== Summary ===`);
  console.log(
    missingInvestorId.length === 0
      ? "✓ No missing investor_id — required:true is safe to add directly."
      : `✗ ${missingInvestorId.length} doc(s) need investor_id backfilled before adding required:true.`
  );
  console.log(
    docsWithDupes === 0
      ? "✓ No duplicate match_id found — the append-vs-replace risk is currently a non-issue."
      : `✗ ${docsWithDupes} doc(s) have duplicate match_id — confirm matchEngine.js behavior before building on this.`
  );
// add to the end of auditStageFilter.js, before disconnect
const stranded = await (await import("../models/StartupProfile.js")).default
  .countDocuments({ stage: { $in: ["Growth", "Late Stage"] } });
console.log(`\nStartups at Growth/Late Stage (currently unmatchable): ${stranded}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
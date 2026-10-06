// server/scripts/backfillMatchSwipeState.js
// Writes explicit status/passCount/passedAt/lastShownAt onto every existing
// matches[] subdocument that doesn't already have them.
// Run: node server/scripts/backfillMatchSwipeState.js

import "dotenv/config";
import mongoose from "mongoose";
import Match from "../models/Match.js";

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Starting backfill...\n");

  const result = await Match.updateMany(
    { "matches.status": { $exists: false } },
    {
      $set: {
        "matches.$[elem].status": "unseen",
        "matches.$[elem].passCount": 0,
        "matches.$[elem].passedAt": null,
        "matches.$[elem].lastShownAt": null,
      },
    },
    {
      arrayFilters: [{ "elem.status": { $exists: false } }],
      multi: true,
    }
  );

  console.log(`Match docs matched: ${result.matchedCount}`);
  console.log(`Match docs modified: ${result.modifiedCount}`);

  // Verify: count remaining subdocuments without status, across all docs
  const remaining = await Match.aggregate([
    { $unwind: "$matches" },
    { $match: { "matches.status": { $exists: false } } },
    { $count: "count" },
  ]);

  console.log(
    remaining.length === 0
      ? "✓ Verified — no matches[] subdocuments remain without status."
      : `✗ ${remaining[0].count} subdocuments still missing status — investigate before proceeding.`
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
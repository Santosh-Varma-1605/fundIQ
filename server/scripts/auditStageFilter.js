// server/scripts/auditStageFilter.js
// Read-only. Answers two things:
//   1. How many investors actually have a stage preference set?
//   2. Does the Qdrant filter actually exclude anyone, or is it a no-op?
// Run: node scripts/auditStageFilter.js

import "dotenv/config";
import mongoose from "mongoose";
import InvestorProfile from "../models/InvestorProfile.js";
import { qdrant } from "../embeddings/vectorStore.js";

const STAGES = ["Pre-Seed", "Seed", "Series A", "Series B", "Series C", "Growth", "Late Stage"];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  // ── 1. Mongo side: who actually set a stage preference? ──
  const withStages = await InvestorProfile.countDocuments({
    preferred_stages: { $exists: true, $ne: [] },
  });
  const withoutStages = await InvestorProfile.countDocuments({
    $or: [{ preferred_stages: { $size: 0 } }, { preferred_stages: { $exists: false } }],
  });

  console.log("=== Investor stage preferences (MongoDB) ===");
  console.log(`  With stage preference set: ${withStages}`);
  console.log(`  With NO stage preference:  ${withoutStages}`);

  // ── 2. Qdrant side: does the filter actually exclude anyone? ──
  const total = await qdrant.count("investors", { exact: true });
  console.log(`\n=== Qdrant filter behaviour ===`);
  console.log(`  Total investors indexed: ${total.count}`);

  for (const stage of STAGES) {
    const filtered = await qdrant.count("investors", {
      exact: true,
      filter: {
        must: [
          {
            should: [
              { key: "preferred_stages", match: { value: stage } },
              { is_empty: { key: "preferred_stages" } },
            ],
          },
        ],
      },
    });
    const pct = ((filtered.count / total.count) * 100).toFixed(1);
    const flag = filtered.count === total.count ? "  ← NO-OP, filter excluded nobody" : "";
    console.log(`  eligible for "${stage}": ${filtered.count}/${total.count} (${pct}%)${flag}`);
  }

  console.log(`\n=== Verdict ===`);
  console.log(
    withoutStages > withStages
      ? "Most investors have no stage preference — high eligibility is expected."
      : "Most investors DO have stage preferences — any 100% row above means the filter isn't working."
  );

  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
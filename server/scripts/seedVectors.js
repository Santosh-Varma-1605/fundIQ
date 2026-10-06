/**
 * seedVectors.js — 3-phase seeding
 *
 * Phase 1 — index all investor vectors into Qdrant
 * Phase 2 — index all startup vectors into Qdrant  
 * Phase 3 — run matching for both (both collections now populated)
 *
 * Run: node scripts/seedVectors.js
 */

import "dotenv/config";

import connectDB       from "../config/db.js";
import StartupProfile  from "../models/StartupProfile.js";
import InvestorProfile from "../models/InvestorProfile.js";
import { ensureCollections, upsertVector, qdrant } from "../embeddings/vectorStore.js";
import { embed }       from "../embeddings/embedder.js";
import { startupToText, investorToText } from "../embeddings/buildText.js";
import { matchStartup, matchInvestor, numericId } from "../matching/matchEngine.js";

await connectDB();
await ensureCollections();

const investors = await InvestorProfile.find({});
const startups  = await StartupProfile.find({});
console.log(`Found ${investors.length} investors and ${startups.length} startups`);

try {
  const info = await qdrant.getCollections();
  console.log("Qdrant connected:", info);
} catch (err) {
  console.error("Qdrant connection failed:", err.message);
  console.error("Cause:", err.cause);
}

// ── PHASE 1 — Index all investor vectors ───────────────────────
console.log("\nPhase 1: Indexing investor vectors...");
let i = 0;
for (const inv of investors) {
  if (!inv.investor_id) continue;
  try {
    const vector = await embed(investorToText(inv));
    await upsertVector("investors", numericId(inv.investor_id), vector, {
      investor_id:       inv.investor_id,
      investor_name:     inv.investor_name    || "",
      preferred_sectors: inv.preferred_sectors ?? [],
      preferred_stages:  inv.preferred_stages  ?? [],
      geo_focus:         inv.geo_focus         || "",
      check_min:         inv.check_min         ?? 0,
      check_max:         inv.check_max         ?? 0,
      pre_revenue_ok:    inv.pre_revenue_ok    ?? false,
    });
    i++;
    if (i % 50 === 0) console.log(`  ${i}/${investors.length} investors indexed`);
  } catch (err) {
    console.error(`  Error ${inv.investor_id}:`, err.message);
  }
}
console.log(`✅ Phase 1 done — ${i} investor vectors indexed`);

// ── PHASE 2 — Index all startup vectors ────────────────────────
console.log("\nPhase 2: Indexing startup vectors...");
let j = 0;
for (const s of startups) {
  if (!s.startup_id) continue;
  try {
    const vector = await embed(startupToText(s));
    await upsertVector("startups", numericId(s.startup_id), vector, {
      startup_id:    s.startup_id,
      startup_name:  s.startup_name  || "",
      sector:        s.sector        || "",
      stage:         s.stage         || "",
      market:        s.market        || "",
      revenue:       s.revenue       ?? 0,
      current_raise: s.current_raise ?? 0,
    });
    j++;
    if (j % 50 === 0) console.log(`  ${j}/${startups.length} startups indexed`);
  } catch (err) {
    console.error(`  Error ${s.startup_id}:`, err.message);
  }
}
console.log(`✅ Phase 2 done — ${j} startup vectors indexed`);

// ── PHASE 3a — Startup matches ─────────────────────────────────
console.log("\nPhase 3a: Generating startup → investor matches...");
let sm = 0;
for (const s of startups) {
  if (!s.startup_id) continue;
  try {
    await matchStartup(s);
    sm++;
    if (sm % 50 === 0) console.log(`  ${sm}/${startups.length} startup matches done`);
  } catch (err) {
    console.error(`  matchStartup error ${s.startup_id}:`, err.message);
  }
}
console.log(`✅ Phase 3a done — ${sm} startup match documents written`);

// ── PHASE 3b — Investor matches ────────────────────────────────
console.log("\nPhase 3b: Generating investor → startup matches...");
let im = 0;
for (const inv of investors) {
  if (!inv.investor_id) continue;
  try {
    await matchInvestor(inv);
    im++;
    if (im % 50 === 0) console.log(`  ${im}/${investors.length} investor matches done`);
  } catch (err) {
    console.error(`  matchInvestor error ${inv.investor_id}:`, err.message);
  }
}
console.log(`✅ Phase 3b done — ${im} investor match documents written`);

console.log("\n🎉 Seed complete.");
console.log(`   Investor vectors : ${i}`);
console.log(`   Startup vectors  : ${j}`);
console.log(`   Startup matches  : ${sm}`);
console.log(`   Investor matches : ${im}`);
process.exit(0);
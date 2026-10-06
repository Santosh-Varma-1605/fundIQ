// server/scripts/testDay5TopUp.js
// Day 5 only — verifies extendCandidates fires when inventory runs low.
// Server must be running.  node scripts/testDay5TopUp.js

import "dotenv/config";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import StartupProfile from "../models/StartupProfile.js";
import Match from "../models/Match.js";

const BASE = process.env.TEST_BASE_URL || "http://localhost:5000";
const SECRET = process.env.JWT_SECRET || process.env.TOKEN_SECRET || process.env.SECRET;

const call = async (path, token) => {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return { status: res.status, body: await res.json() };
};

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const doc = await Match.findOne({ entity_type: "startup", "matches.49": { $exists: true } });
  const startup = await StartupProfile.findOne({ startup_id: doc.entity_id });
  const token = jwt.sign({ id: String(startup.startupId) }, SECRET, { expiresIn: "1h" });

  console.log(`${startup.startup_id} — ${doc.matches.length} candidates before\n`);

  // Mark all but 5 as passed, simulating a user who has swiped the deck down.
  const keepUnseen = doc.matches.slice(0, 5).map(m => m.match_id);
  await Match.updateOne(
    { entity_id: doc.entity_id },
    { $set: { "matches.$[el].status": "passed", "matches.$[el].passedAt": new Date(),
              "matches.$[el].passCount": 1 } },
    { arrayFilters: [{ "el.match_id": { $nin: keepUnseen } }] }
  );
  console.log(`Marked ${doc.matches.length - 5} as passed, 5 unseen remain (< LOW_INVENTORY of 10)`);

  console.log(`\nGET /api/startup/feed?limit=10  -> should trigger top-up`);
  const feed = await call("/api/startup/feed?limit=10", token);
  if (feed.status !== 200) { console.error(feed); process.exit(1); }

  const after = await Match.findOne({ entity_id: doc.entity_id });
  const grew = after.matches.length - doc.matches.length;

  console.log(`  candidates after: ${after.matches.length}  (${grew > 0 ? `+${grew} appended ✓` : "no growth ✗"})`);
  console.log(`  poolDrained: ${feed.body.poolDrained}`);
  console.log(`  cards returned: ${feed.body.cards.length}`);
  feed.body.cards.forEach((c, i) =>
    console.log(`    ${i+1}. ${c.match_id} score ${c.score} ${c.resurfaced ? "[resurfaced]" : "[new]"}`));

  const resurfaced = feed.body.cards.filter(c => c.resurfaced).length;
  console.log(`\n  ${resurfaced === 0 ? "✓" : "✗"} ${resurfaced}/10 are resurfaced passes (tier should keep this at 0)`);

  console.log(`\nRestore with: node scripts/rebuildAllMatches.js`);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
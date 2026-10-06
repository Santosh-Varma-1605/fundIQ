// server/scripts/testSmartMatch.js
//
// End-to-end check of the Day 5 + Day 6 endpoints.
// Mints its own JWT from your .env secret, so no login or password needed.
//
// REQUIRES THE SERVER TO BE RUNNING in another terminal:
//   npm run dev     (or: node server.js)
//
// Then:  node scripts/testSmartMatch.js

import "dotenv/config";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import StartupProfile from "../models/StartupProfile.js";
import InvestorProfile from "../models/InvestorProfile.js";
import Match from "../models/Match.js";
import Interaction from "../models/Interaction.js";
import Connection from "../models/Connection.js";

const BASE = process.env.TEST_BASE_URL || "http://localhost:5000";

// .env key naming varies between projects — try the usual suspects.
const SECRET =
  process.env.JWT_SECRET ||
  process.env.JWT_SECRET_KEY ||
  process.env.TOKEN_SECRET ||
  process.env.SECRET;

function mintToken(userObjectId) {
  // Payload shape matches what authMiddleware reads (req.user.id).
  return jwt.sign({ id: String(userObjectId) }, SECRET, { expiresIn: "1h" });
}

async function call(path, token, options = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text; }
    return { status: res.status, body };
  } catch (err) {
    // Server down or restarting — report it as a result rather than
    // throwing, so the remaining checks still run.
    return { status: 0, body: { error: err.message }, failed: true };
  }
}

async function main() {
  if (!SECRET) {
    console.error("✗ No JWT secret found in .env (looked for JWT_SECRET, JWT_SECRET_KEY, TOKEN_SECRET, SECRET).");
    console.error("  Open server/.env, find the key your authMiddleware uses, and set it as JWT_SECRET here.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected. Testing against ${BASE}\n`);

  // Pick a startup that actually has candidates to serve
  const matchDoc = await Match.findOne({ entity_type: "startup", "matches.0": { $exists: true } });
  const startup = await StartupProfile.findOne({ startup_id: matchDoc.entity_id });
  const sToken = mintToken(startup.startupId);

  console.log(`Acting as startup ${startup.startup_id} (${startup.startup_name || "unnamed"})`);
  console.log(`  stage=${startup.stage} market=${startup.market} candidates=${matchDoc.matches.length}\n`);

  // ── 1. FEED ──────────────────────────────────────────────────
  console.log("1. GET /api/startup/feed?limit=5");
  const feed = await call("/api/startup/feed?limit=5", sToken);
  if (feed.status !== 200) {
    console.error(`   ✗ ${feed.status}:`, feed.body);
    console.error("\n   If 401: the JWT payload shape may differ — check authMiddleware.js.");
    console.error("   If ECONNREFUSED: the server isn't running.");
    await mongoose.disconnect();
    process.exit(1);
  }
  const { cards, remaining, exhausted, poolDrained, modelVersion } = feed.body;
  console.log(`   ✓ ${cards.length} cards | remaining ${remaining} | exhausted ${exhausted} | poolDrained ${poolDrained} | model ${modelVersion ?? "cold start"}`);
  cards.forEach((c, i) =>
    console.log(`     ${i + 1}. ${c.match_id} ${String(c.name).slice(0, 28).padEnd(28)} score ${c.score} (recip ${c.reciprocal_score}) ${c.resurfaced ? "[resurfaced]" : ""}${c.stage_relaxed ? "[stage relaxed]" : ""}`)
  );

  // ── 2. EXCLUDE ───────────────────────────────────────────────
  const firstTwo = cards.slice(0, 2).map((c) => c.match_id);
  console.log(`\n2. GET feed again with ?exclude=${firstTwo.join(",")}`);
  const feed2 = await call(`/api/startup/feed?limit=5&exclude=${firstTwo.join(",")}`, sToken);
  const returned = feed2.body.cards.map((c) => c.match_id);
  const leaked = returned.filter((id) => firstTwo.includes(id));
  console.log(`   ${leaked.length === 0 ? "✓" : "✗"} excluded ids absent: ${leaked.length === 0 ? "yes" : `LEAKED ${leaked}`}`);
  console.log(`     now showing: ${returned.join(", ")}`);

  // ── 3. PASS ──────────────────────────────────────────────────
  const passTarget = cards[0].match_id;
  console.log(`\n3. POST /api/swipe { ${passTarget}, pass }`);
  const pass = await call("/api/swipe", sToken, {
    method: "POST",
    body: JSON.stringify({ targetId: passTarget, action: "pass" }),
  });
  console.log(`   ${pass.status === 200 ? "✓" : "✗"} ${pass.status}`, JSON.stringify(pass.body));

  const afterPass = await Match.findOne({ entity_id: startup.startup_id });
  const passedEntry = afterPass.matches.find((m) => m.match_id === passTarget);
  console.log(`   entry now: status=${passedEntry.status} passCount=${passedEntry.passCount} passedAt=${passedEntry.passedAt ? "set" : "null"}`);

  const feed3 = await call("/api/startup/feed?limit=5", sToken);
  if (feed3.failed || !feed3.body?.cards) {
    console.log(`   ⚠ feed unavailable after swipe — server likely crashed. Check terminal 1.`);
  } else {
    const stillTop = feed3.body.cards.some((c) => c.match_id === passTarget);
    console.log(`   ${stillTop ? "✗" : "✓"} passed card ${stillTop ? "STILL in" : "dropped out of"} top 5`);
  }

  // ── 4. DOUBLE SUBMIT ─────────────────────────────────────────
  console.log(`\n4. POST the same pass again (double-submit guard)`);
  const dup = await call("/api/swipe", sToken, {
    method: "POST",
    body: JSON.stringify({ targetId: passTarget, action: "pass" }),
  });
  console.log(`   ${dup.body.duplicate ? "✓" : "✗"} flagged duplicate: ${Boolean(dup.body.duplicate)}`);
  const reread = await Match.findOne({ entity_id: startup.startup_id });
  const pc = reread.matches.find((m) => m.match_id === passTarget).passCount;
  console.log(`   ${pc === 1 ? "✓" : "✗"} passCount still ${pc} (not double-counted)`);

  // ── 5. MUTUAL MATCH ──────────────────────────────────────────
  const likeTarget = feed3.body.cards.find((c) => c.match_id !== passTarget)?.match_id;
  console.log(`\n5. Mutual match: startup likes ${likeTarget}, then that investor likes back`);

  const like1 = await call("/api/swipe", sToken, {
    method: "POST",
    body: JSON.stringify({ targetId: likeTarget, action: "like" }),
  });
  console.log(`   startup -> investor: isMatch=${like1.body.isMatch} (expected false, one-sided so far)`);

  // Now act as that investor. Their deck must contain this startup for the
  // swipe to be accepted — the route only allows swiping on real candidates.
  const investor = await InvestorProfile.findOne({ investor_id: likeTarget });
  const invMatch = await Match.findOne({ entity_id: likeTarget });
  const hasUsBack = invMatch?.matches?.some((m) => m.match_id === startup.startup_id);

  if (!investor || !invMatch || !hasUsBack) {
    console.log(`   ⚠ skipped — ${likeTarget} doesn't have ${startup.startup_id} in their own deck.`);
    console.log(`     Not a bug: match lists aren't symmetric, each side ranks independently.`);
  } else {
    const iToken = mintToken(investor.investorId);
    const like2 = await call("/api/swipe", iToken, {
      method: "POST",
      body: JSON.stringify({ targetId: startup.startup_id, action: "like" }),
    });
    console.log(`   investor -> startup: ${like2.body.isMatch ? "✓ MATCH" : "✗ no match"}`, JSON.stringify(like2.body.connection || {}));

    const conns = await call("/api/connections", iToken);
    console.log(`   GET /api/connections -> ${Array.isArray(conns.body) ? conns.body.length : "?"} connection(s)`);
  }

  // ── 6. DATA WRITTEN ──────────────────────────────────────────
  console.log(`\n6. Persistence`);
  const ints = await Interaction.find({ actorId: startup.startup_id }).sort({ createdAt: -1 }).limit(5).lean();
  console.log(`   Interaction rows for ${startup.startup_id}: ${ints.length}`);
  ints.forEach((i) => {
    const hasFeat = i.features && typeof i.features.reciprocalScore === "number";
    console.log(`     ${i.action.padEnd(5)} -> ${i.targetId}  features:${hasFeat ? "✓" : "✗ MISSING"}  model:${i.modelVersion ?? "cold"}`);
  });
  console.log(`   Connections total: ${await Connection.countDocuments()}`);

  console.log(`\nDone. To reset this test data:`);
  console.log(`   Interaction.deleteMany({}), Connection.deleteMany({}), then re-run rebuildAllMatches.js`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("\nTest failed:", err.message);
  if (err.cause?.code === "ECONNREFUSED") {
    console.error("The server isn't running. Start it in another terminal first.");
  }
  process.exit(1);
});
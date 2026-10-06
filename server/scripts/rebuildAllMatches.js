// server/scripts/rebuildAllMatches.js
// One-time full rebuild of every Match doc under hard-filter + reciprocal
// scoring. Safe to re-run — matchStartup()/matchInvestor() overwrite
// matches[] wholesale each time (confirmed clean in the Day 1 audit), so
// re-running over entries that already succeeded is harmless.
//
// Changes from the first version:
//  - retry with backoff per entity (fixes the "fetch failed" block —
//    transient Qdrant/network blips no longer silently skip entities)
//  - small concurrency pool instead of fully sequential (faster, without
//    the risk of hammering embed+Qdrant+Mongo all at once)
//  - progress printed every N completions instead of per-item — the
//    per-item console.log from matchStartup()/matchInvestor() itself is
//    suppressed here too, so the terminal isn't flooded

import "dotenv/config";
import mongoose from "mongoose";
import StartupProfile from "../models/StartupProfile.js";
import InvestorProfile from "../models/InvestorProfile.js";
import { matchStartup, matchInvestor } from "../matching/matchEngine.js";

const CONCURRENCY = 8;        // parallel entities in flight at once
const RETRY_ATTEMPTS = 3;
const PROGRESS_EVERY = 25;    // print a progress line every N completions

// Suppress the per-item console.log inside matchStartup()/matchInvestor()
// for the duration of this script, without touching that file. Restored
// at the end either way.
const originalLog = console.log;
function silenceInnerLogs() { console.log = () => {}; }
function restoreLogs() { console.log = originalLog; }

async function withRetry(fn, label, attempts = RETRY_ATTEMPTS) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts) throw err;
      await new Promise((r) => setTimeout(r, i * 1500)); // 1.5s, 3s, ...
    }
  }
}

// Runs `fn` over `items` with at most `limit` in flight at once.
// Returns { ok, fail, failures: [{ id, error }] }.
async function runPool(items, limit, fn, label) {
  let ok = 0, fail = 0;
  const failures = [];
  let completed = 0;
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const item = items[index++];
      try {
        await fn(item);
        ok++;
      } catch (err) {
        fail++;
        failures.push({ id: item._id, error: err.message });
      }
      completed++;
      if (completed % PROGRESS_EVERY === 0 || completed === items.length) {
        originalLog(`  ${label}: ${completed}/${items.length} done (${ok} ok, ${fail} failed)`);
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, worker));
  return { ok, fail, failures };
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  originalLog("Connected. Rebuilding all Match docs under corrected scoring...\n");

  const startups = await StartupProfile.find({ startup_id: { $exists: true, $ne: null } });
  const investors = await InvestorProfile.find({ investor_id: { $exists: true, $ne: null } });

  silenceInnerLogs();

  originalLog(`Rebuilding ${startups.length} startup match lists (concurrency ${CONCURRENCY})...`);
  const startupResult = await runPool(
    startups,
    CONCURRENCY,
    (sp) => withRetry(() => matchStartup(sp), sp.startup_id),
    "Startups"
  );

  originalLog(`\nRebuilding ${investors.length} investor match lists (concurrency ${CONCURRENCY})...`);
  const investorResult = await runPool(
    investors,
    CONCURRENCY,
    (ip) => withRetry(() => matchInvestor(ip), ip.investor_id),
    "Investors"
  );

  restoreLogs();

  console.log(`\n=== Summary ===`);
  console.log(`Startups: ${startupResult.ok} rebuilt, ${startupResult.fail} failed`);
  console.log(`Investors: ${investorResult.ok} rebuilt, ${investorResult.fail} failed`);

  if (startupResult.failures.length || investorResult.failures.length) {
    console.log(`\nFailed after ${RETRY_ATTEMPTS} attempts each:`);
    [...startupResult.failures, ...investorResult.failures].forEach((f) =>
      console.log(`  ✗ ${f.id}: ${f.error}`)
    );
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  restoreLogs();
  console.error("Rebuild failed:", err);
  process.exit(1);
});
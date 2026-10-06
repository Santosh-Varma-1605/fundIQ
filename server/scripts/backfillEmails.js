/**
 * backfillEmails.js — one-off script to add missing `email` field
 * to already-seeded InvestorProfile / StartupProfile documents,
 * matched by investor_id / startup_id from the source CSVs.
 *
 * This does NOT touch Qdrant, vectors, or matches — it only patches
 * the `email` field on existing Mongo documents.
 *
 * Run: node scripts/backfillEmails.js
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

import connectDB       from "../config/db.js";
import StartupProfile  from "../models/StartupProfile.js";
import InvestorProfile from "../models/InvestorProfile.js";

// Adjust these paths if your CSVs live elsewhere
const STARTUPS_CSV  = path.resolve("./scripts/data/startups.csv");
const INVESTORS_CSV = path.resolve("./scripts/data/investors.csv");

function loadCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

await connectDB();

// ── Startups ─────────────────────────────────────────────
console.log("\nReading startups CSV...");
const startupRows = loadCsv(STARTUPS_CSV);
console.log(`Found ${startupRows.length} rows`);

let sUpdated = 0, sSkipped = 0, sNotFound = 0;
for (const row of startupRows) {
  if (!row.startup_id || !row.email) { sSkipped++; continue; }
  const result = await StartupProfile.updateOne(
    { startup_id: row.startup_id },
    { $set: { email: row.email } }
  );
  if (result.matchedCount === 0) sNotFound++;
  else sUpdated++;
}
console.log(`✅ Startups — updated: ${sUpdated}, skipped (no email/id): ${sSkipped}, not found in DB: ${sNotFound}`);

// ── Investors ────────────────────────────────────────────
console.log("\nReading investors CSV...");
const investorRows = loadCsv(INVESTORS_CSV);
console.log(`Found ${investorRows.length} rows`);

let iUpdated = 0, iSkipped = 0, iNotFound = 0;
for (const row of investorRows) {
  if (!row.investor_id || !row.email) { iSkipped++; continue; }
  const result = await InvestorProfile.updateOne(
    { investor_id: row.investor_id },
    { $set: { email: row.email } }
  );
  if (result.matchedCount === 0) iNotFound++;
  else iUpdated++;
}
console.log(`✅ Investors — updated: ${iUpdated}, skipped (no email/id): ${iSkipped}, not found in DB: ${iNotFound}`);

console.log("\n🎉 Email backfill complete.");
process.exit(0);
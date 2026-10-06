/**
 * seedProfiles.js
 *
 * Reads investors.csv and startups.csv and upserts InvestorProfile
 * and StartupProfile documents. Also links them to the matching
 * Investor / Startup auth documents by email.
 *
 * CSV files should be in: scripts/data/investors.csv
 *                          scripts/data/startups.csv
 *
 * Run: node scripts/seedProfiles.js
 */

import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import csv from "csvtojson";

import Investor from "../models/Investor.js";
import Startup  from "../models/Startup.js";
import InvestorProfile from "../models/InvestorProfile.js";
import StartupProfile  from "../models/StartupProfile.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MONGO_URI  = process.env.MONGO_URI || "mongodb://localhost:27017/fundiq";
const DOMAIN     = "fundiq-sim.com";

function parseBool(val) {
  if (typeof val === "boolean") return val;
  return String(val).toLowerCase() === "true";
}

function parseArr(val) {
  if (!val) return [];
  return val.split(",").map(s => s.trim()).filter(Boolean);
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  // ── Investor Profiles ──────────────────────────────────────
  const investorCsvPath = path.join(__dirname, "data", "investors.csv");
  if (!fs.existsSync(investorCsvPath)) {
    console.warn("⚠️  investors.csv not found at", investorCsvPath, "— skipping investors");
  } else {
    const rows = await csv().fromFile(investorCsvPath);
    let count = 0;

    for (const row of rows) {
      const email = `${row.investor_id}@${DOMAIN}`;
      const authDoc = await Investor.findOne({ email });
      if (!authDoc) {
        console.warn(`  No auth doc for ${email}, skipping`);
        continue;
      }

      await InvestorProfile.updateOne(
        { investor_id: row.investor_id },
        {
          $set: {
            investorId:        authDoc._id,
            investor_id:       row.investor_id,
            investor_name:     row.investor_name,
            preferred_sectors: parseArr(row.preferred_sectors),
            preferred_stages:  parseArr(row.preferred_stages),
            geo_focus:         row.geo_focus,
            check_min:         Number(row.check_min),
            check_max:         Number(row.check_max),
            risk_appetite:     row.risk_appetite,
            avg_check_usd:     Number(row.avg_check_usd),
            deals_per_year:    Number(row.deals_per_year),
            pre_revenue_ok:    parseBool(row.pre_revenue_ok),
            thesis_text:       row.thesis_text,
          }
        },
        { upsert: true }
      );
      count++;
    }
    console.log(`✅ InvestorProfiles upserted: ${count}`);
  }

  // ── Startup Profiles ───────────────────────────────────────
  const startupCsvPath = path.join(__dirname, "data", "startups.csv");
  if (!fs.existsSync(startupCsvPath)) {
    console.warn("⚠️  startups.csv not found at", startupCsvPath, "— skipping startups");
  } else {
    const rows = await csv().fromFile(startupCsvPath);
    let count = 0;

    for (const row of rows) {
      const email = `${row.startup_id}@${DOMAIN}`;
      const authDoc = await Startup.findOne({ email });
      if (!authDoc) {
        console.warn(`  No auth doc for ${email}, skipping`);
        continue;
      }

      await StartupProfile.updateOne(
        { startup_id: row.startup_id },
        {
          $set: {
            startupId:     authDoc._id,
            startup_id:    row.startup_id,
            startup_name:  row.startup_name,
            sector:        row.sector,
            stage:         row.stage,
            market:        row.market,
            hq_country:    row.hq_country,
            total_raised:  Number(row.total_raised),
            current_raise: Number(row.current_raise),
            revenue:       Number(row.revenue),
            growth_rate:   Number(row.growth_rate),
            team_size:     Number(row.team_size),
            traction_score:Number(row.traction_score),
            risk_score:    Number(row.risk_score),
          }
        },
        { upsert: true }
      );
      count++;
    }
    console.log(`✅ StartupProfiles upserted: ${count}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
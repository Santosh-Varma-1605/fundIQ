/**
 * seedAuthUsers.js
 *
 * Creates 500 Investor auth accounts  (INV-0001 … INV-0500)
 * and 500 Startup auth accounts       (ST-0001  … ST-0500)
 *
 * Email format:
 *   INV-0001@fundiq-sim.com
 *   ST-0001@fundiq-sim.com
 *
 * Password (all accounts): testing321
 *
 * Run: node scripts/seedAuthUsers.js
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Investor from "../models/Investor.js";
import Startup from "../models/Startup.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/fundiq";
const PASSWORD_PLAIN = "testing321";
const DOMAIN = "fundiq-sim.com";

function pad(n, len = 4) {
  return String(n).padStart(len, "0");
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const hashedPassword = await bcrypt.hash(PASSWORD_PLAIN, 10);

  // ── Investors ──────────────────────────────────────────────
  const investorDocs = [];
  for (let i = 1; i <= 500; i++) {
    const id = `INV-${pad(i)}`;
    investorDocs.push({
      firstName: "Investor",
      lastName:  pad(i),
      email:     `${id}@${DOMAIN}`,
      password:  hashedPassword,
      isVerified: true,
    });
  }

  let inv = 0;
  for (const doc of investorDocs) {
    try {
      await Investor.updateOne(
        { email: doc.email },
        { $setOnInsert: doc },
        { upsert: true }
      );
      inv++;
    } catch (e) {
      console.error("Investor upsert error:", e.message);
    }
  }
  console.log(`✅ Investors created/verified: ${inv}`);

  // ── Startups ───────────────────────────────────────────────
  const startupDocs = [];
  for (let i = 1; i <= 500; i++) {
    const id = `ST-${pad(i)}`;
    startupDocs.push({
      firstName: "Startup",
      lastName:  pad(i),
      email:     `${id}@${DOMAIN}`,
      password:  hashedPassword,
      isVerified: true,
    });
  }

  let st = 0;
  for (const doc of startupDocs) {
    try {
      await Startup.updateOne(
        { email: doc.email },
        { $setOnInsert: doc },
        { upsert: true }
      );
      st++;
    } catch (e) {
      console.error("Startup upsert error:", e.message);
    }
  }
  console.log(`✅ Startups created/verified: ${st}`);

  console.log("\n📋 Credentials summary:");
  console.log("  Investor logins: INV-0001@fundiq-sim.com … INV-0500@fundiq-sim.com");
  console.log("  Startup  logins: ST-0001@fundiq-sim.com  … ST-0500@fundiq-sim.com");
  console.log("  Password (all) : testing321");

  await mongoose.disconnect();
  console.log("\nDone.");
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
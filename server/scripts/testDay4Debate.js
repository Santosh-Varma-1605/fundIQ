import "dotenv/config";
import { runArbiter } from "../agents/arbiter/orchestrator.js";

// Deliberately includes selfAssessedWeaknesses — this is the fixture that
// lets us verify the routing rule: this field must reach the Skeptic only.
const testInput = {
  role: "startup",
  companyName: "Nimbus Robotics",
  sector: "climate tech",
  stage: "seed",
  pitchDeckOrSummary: "Autonomous drones for methane leak detection at oil & gas sites.",
  tractionMetrics: "$18K MRR, 6 paying pilot customers, 22% MoM growth",
  fundingAsk: 1500000,
  fundingAskCurrency: "usd",
  selfAssessedWeaknesses: "We have no patents filed yet and our only hardware supplier is a single vendor in Taiwan.",
};

function printTurn(turn) {
  console.log(`\n--- ${turn.agent.toUpperCase()} (round ${turn.round}) ---`);
  console.log(turn.content);
}

async function main() {
  console.log("Running full debate — this makes 5 real Groq calls, expect ~10-20s...\n");

  const result = await runArbiter(testInput, "test-run-day4");

  result.transcript.forEach(printTurn);

  console.log("\n\n=== CHECKS ===");

  const debateTurns = result.transcript.filter((t) => t.agent === "advocate" || t.agent === "skeptic");
  const stillStubbed = debateTurns.filter((t) => t.content.includes("[STUB]"));
  if (stillStubbed.length > 0) {
    throw new Error(`${stillStubbed.length} debate turn(s) still stubbed — expected 0.`);
  }
  console.log("✅ No stubbed debate turns — Advocate and Skeptic both real in both rounds.");

  const advocateR1 = debateTurns.find((t) => t.agent === "advocate" && t.round === 1).content;
  const advocateR2 = debateTurns.find((t) => t.agent === "advocate" && t.round === 2).content;
  const skepticR1 = debateTurns.find((t) => t.agent === "skeptic" && t.round === 1).content;
  const skepticR2 = debateTurns.find((t) => t.agent === "skeptic" && t.round === 2).content;

  if (advocateR1.trim() === advocateR2.trim()) {
    throw new Error("Advocate round 2 is identical to round 1 — not rebutting, just repeating.");
  }
  if (skepticR1.trim() === skepticR2.trim()) {
    throw new Error("Skeptic round 2 is identical to round 1 — not rebutting, just repeating.");
  }
  console.log("✅ Round 2 differs from round 1 for both agents (not verbatim repeats).");

  const leaked = advocateR1.toLowerCase().includes("taiwan") || advocateR1.toLowerCase().includes("patent");
  if (leaked) {
    console.warn("⚠️  Advocate's opening may have leaked the red-flag content — read it above and confirm by eye.");
  } else {
    console.log("✅ Advocate's opening does not obviously mention the founder-flagged weakness.");
  }

  const skepticUsedIt = skepticR1.toLowerCase().includes("taiwan") || skepticR1.toLowerCase().includes("patent");
  console.log(
    skepticUsedIt
      ? "✅ Skeptic's opening references the founder-flagged weakness, as expected."
      : "⚠️  Skeptic's opening did not reference the founder-flagged weakness — read it above, may just be phrased differently."
  );

  console.log("\n✅ Day 4 debate loop verified.");
}

main().catch((err) => {
  console.error("\n❌ Day 4 debate check FAILED:");
  console.error(err);
  process.exit(1);
});
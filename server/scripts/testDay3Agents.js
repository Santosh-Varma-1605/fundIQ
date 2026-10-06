import "dotenv/config";
import { analystNode } from "../agents/arbiter/analyst.js";
import { advocateNode } from "../agents/arbiter/advocate.js";

const testInput = {
  role: "startup",
  companyName: "Nimbus Robotics",
  sector: "climate tech",
  stage: "seed",
  pitchDeckOrSummary: "Autonomous drones for methane leak detection at oil & gas sites.",
  tractionMetrics: "$18K MRR, 6 paying pilot customers, 22% MoM growth",
  fundingAsk: 1500000,
  fundingAskCurrency: "usd",
};

async function main() {
  console.log("=== Testing analyst_node ===");
  let state = {
    input: testInput,
    marketContext: null,
    transcript: [],
    round: 0,
    maxRounds: 2,
    verdict: null,
    status: "running",
    runId: "test-day3",
  };

  state = await analystNode(state);
  console.log("\nMarket context:\n", JSON.stringify(state.marketContext, null, 2));

  if (!state.marketContext?.sectorTrend) {
    throw new Error("analyst_node did not produce a sectorTrend.");
  }
  console.log("\n✅ analyst_node produced a real MarketBrief.");

  console.log("\n=== Testing advocate_node (round 1) ===");
  state.round = 1;
  state = await advocateNode(state);
  const advocateTurn = state.transcript[state.transcript.length - 1];
  console.log("\nAdvocate said:\n", advocateTurn.content);

  if (advocateTurn.content.includes("[STUB]")) {
    throw new Error("advocate_node round 1 returned a stub, not a real response.");
  }
  console.log("\n✅ advocate_node round 1 produced a real, non-stub argument.");
}

main().catch((err) => {
  console.error("\n❌ Day 3 agent check FAILED:");
  console.error(err);
  process.exit(1);
});
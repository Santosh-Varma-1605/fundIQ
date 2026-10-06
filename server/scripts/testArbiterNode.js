import "dotenv/config";
import { arbiterNode } from "../agents/arbiter/moderator.js";

const fakeState = {
  input: { role: "startup", companyName: "Nimbus Robotics", sector: "climate tech", stage: "seed" },
  marketContext: {
    sectorTrend: "Climate tech funding is rising sharply while early-stage deal activity is falling.",
    comparableRaises: ["Acme Geothermal raised $134M Series C, 2026"],
    notableNews: ["Low-carbon data centers driving a 55% YoY funding surge in H1 2026"],
    generatedAt: new Date().toISOString(),
  },
  transcript: [
    { agent: "advocate", round: 1, content: "Strong traction: $18K MRR, 22% MoM growth, 6 paying pilots.", createdAt: new Date().toISOString() },
    { agent: "skeptic", round: 1, content: "No patents filed, single hardware vendor in Taiwan, thin revenue base for a $1.5M raise.", createdAt: new Date().toISOString() },
    { agent: "advocate", round: 2, content: "First-mover advantage is common at seed stage; supply chain can diversify post-raise.", createdAt: new Date().toISOString() },
    { agent: "skeptic", round: 2, content: "First-mover claims cited late-stage comparables, not seed-stage proof; supply risk remains unaddressed today.", createdAt: new Date().toISOString() },
  ],
  round: 2,
  maxRounds: 2,
  verdict: null,
  status: "running",
  runId: "test-arbiter-node",
};

async function main() {
  console.log("Calling arbiter_node with a canned transcript...\n");
  const result = await arbiterNode(fakeState);

  console.log(JSON.stringify(result.verdict, null, 2));

  const v = result.verdict;
  if (typeof v.score !== "number" || v.score < 0 || v.score > 100) {
    throw new Error(`score is not a valid number 0-100: ${v.score}`);
  }
  if (!["low", "medium", "high"].includes(v.confidence)) {
    throw new Error(`confidence is not a valid enum value: ${v.confidence}`);
  }
  if (!v.summary || v.summary.length < 10) {
    throw new Error("summary is missing or too short.");
  }

  console.log("\n✅ arbiter_node produced a schema-valid Verdict.");
}

main().catch((err) => {
  console.error("\n❌ arbiter_node check FAILED:");
  console.error(err);
  process.exit(1);
});
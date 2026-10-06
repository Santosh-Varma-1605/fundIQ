import "dotenv/config";
import { runArbiter } from "../agents/arbiter/orchestrator.js";

async function main() {
  const start = Date.now();

  const result = await runArbiter(
    { role: "startup", companyName: "Test Co", sector: "fintech", stage: "seed", pitchDeckOrSummary: "x" },
    "test-run-day2"
  );

  const elapsedMs = Date.now() - start;

  console.log("\nFinal status:", result.status);
  console.log("Transcript turn count:", result.transcript.length);
  console.log("Transcript order:", result.transcript.map((t) => `${t.agent}:r${t.round}`).join(", "));
  console.log("Verdict shape ok:", typeof result.verdict?.score === "number");
  console.log(`Elapsed: ${elapsedMs}ms`);

  const expectedTurns = 6; // analyst, advocate, skeptic, advocate, skeptic, arbiter
  if (result.transcript.length !== expectedTurns) {
    throw new Error(`Expected ${expectedTurns} transcript turns, got ${result.transcript.length}`);
  }
  if (result.status !== "complete") {
    throw new Error(`Expected status "complete", got "${result.status}"`);
  }

  console.log("\n✅ Graph skeleton verified — loops exactly maxRounds times, ends complete.");
}

main().catch((err) => {
  console.error("\n❌ Graph skeleton check FAILED:");
  console.error(err);
  process.exit(1);
});
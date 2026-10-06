// Requires the server already running: `npm run dev` in another terminal.

const BASE_URL = "http://localhost:5000/api/arbiter";

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("POSTing to /api/arbiter/analyze...");
  const analyzeRes = await fetch(`${BASE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testInput),
  });

  if (analyzeRes.status !== 202) {
    throw new Error(`Expected 202, got ${analyzeRes.status}: ${await analyzeRes.text()}`);
  }

  const { runId } = await analyzeRes.json();
  console.log(`Got runId: ${runId}. Polling /status every 3s...\n`);

  const maxAttempts = 40;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await sleep(3000);
    const statusRes = await fetch(`${BASE_URL}/${runId}/status`);
    const statusData = await statusRes.json();

    console.log(`[attempt ${attempt}] status: ${statusData.status}`);

    if (statusData.status === "complete") {
      console.log("\nVerdict:\n", JSON.stringify(statusData.verdict, null, 2));
      console.log("\n✅ Full API round-trip verified: POST /analyze -> poll /status -> real Verdict.");
      return;
    }
    if (statusData.status === "failed") {
      throw new Error(`Run failed: ${statusData.errorMessage}`);
    }
  }

  throw new Error("Timed out waiting for run to complete after 60s.");
}

main().catch((err) => {
  console.error("\n❌ API smoke test FAILED:");
  console.error(err);
  process.exit(1);
});
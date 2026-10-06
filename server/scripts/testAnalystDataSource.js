import "dotenv/config";

async function testTavilySearch(query) {
  if (!process.env.TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY is missing from server/.env — sign up at tavily.com first.");
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: 3,
      search_depth: "basic",
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily returned ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return data.results ?? [];
}

async function main() {
  console.log("Calling Tavily...");
  const results = await testTavilySearch("latest startup funding news");

  console.log("\nRaw result count:", results.length);

  if (!results.length) {
    throw new Error("Tavily responded but returned zero results — check the query/account.");
  }

  console.log(`\n✅ Tavily reachable — got ${results.length} result(s):\n`);
  results.forEach((r, i) => console.log(`${i + 1}. ${r.title}`));
}

main().catch((err) => {
  console.error("\n❌ Analyst data source check FAILED:");
  console.error(err.message);
  process.exit(1);
});
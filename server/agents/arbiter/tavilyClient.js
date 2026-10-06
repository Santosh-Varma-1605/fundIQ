export async function tavilySearch(query, maxResults = 5) {
  if (!process.env.TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY is missing from the environment. Add it to server/.env.");
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: maxResults,
      search_depth: "basic",
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily returned ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return data.results ?? [];
}
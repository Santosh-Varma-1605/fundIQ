import { tavilySearch } from "./tavilyClient.js";
import { callGroq } from "./groqClient.js";

function safeParseJSON(text, fallback) {
  try {
    const cleaned = text.replace(/```json\s*|```\s*/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn("[analyst_node] Failed to parse Groq JSON output, using fallback.", err.message);
    return fallback;
  }
}

export async function analystNode(state) {
  const { sector, stage } = state.input;

  // Broad query, deliberately — Day 1 testing showed over-narrow queries
  // (e.g. "seed funding fintech 2026") return zero results. Let Tavily's
  // relevance ranking do the narrowing, not the query string.
  const query = `${sector} startup funding trends`;
  const rawResults = await tavilySearch(query, 5);

  const rawText = rawResults
    .map((r, i) => `${i + 1}. ${r.title}\n${r.content ?? ""}`)
    .join("\n\n");

  const summaryPrompt = `Below are raw web search results about the "${sector}" sector at the "${stage}" stage.

${rawText || "(no search results returned)"}

Summarize this into strict JSON with this exact shape, no markdown, no preamble:
{
  "sectorTrend": "one sentence describing the funding trend direction",
  "comparableRaises": ["short factual line", "short factual line"],
  "notableNews": ["short factual line", "short factual line"]
}
Only include facts actually present above. If nothing relevant is present, return empty arrays and say so in sectorTrend.`;

  const raw = await callGroq({
    systemPrompt: "You are a terse, factual data summarizer. Output only valid JSON, nothing else.",
    userPrompt: summaryPrompt,
    temperature: 0.2,
  });

  const parsed = safeParseJSON(raw, {
    sectorTrend: `No clear trend data found for ${sector}.`,
    comparableRaises: [],
    notableNews: [],
  });

  const marketContext = {
    sectorTrend: parsed.sectorTrend ?? "",
    comparableRaises: parsed.comparableRaises ?? [],
    notableNews: parsed.notableNews ?? [],
    generatedAt: new Date().toISOString(),
  };

  return {
    ...state,
    marketContext,
    transcript: [
      ...state.transcript,
      {
        agent: "analyst",
        round: 0,
        content: marketContext.sectorTrend,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}
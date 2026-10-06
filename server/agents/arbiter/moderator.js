import { callGroq } from "./groqClient.js";
import { formatMarketContext } from "./promptUtils.js";

function safeParseJSON(text, fallback) {
  try {
    const cleaned = text.replace(/```json\s*|```\s*/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn("[arbiter_node] Failed to parse Groq JSON output, using fallback.", err.message);
    return fallback;
  }
}

const ARBITER_SYSTEM_PROMPT = `You are The Arbiter — the final judge in a structured investment debate run by FundIQ.

You have read the full debate transcript between an Advocate (bull case) and a Skeptic (bear case), informed by real market data. Your job: weigh both sides and deliver a final, honest verdict.

Rules:
- Base your verdict ONLY on the transcript and market context provided — do not introduce new facts.
- Be genuinely balanced — if the Skeptic raised objections the Advocate never adequately answered, say so in unresolvedRisks. Do not just side with whichever agent sounded more confident.
- targetSectors should be specific angles/sectors this company or its investors should lean into, grounded in what was actually discussed.
- recommendedAdjustments should be concrete and actionable, not generic advice.
- whatWouldChangeTheVerdict should name specific things that would move the score, e.g. "a signed LOI from a Fortune 500 client" — not vague reassurance.
- Output STRICT JSON only, no markdown, no preamble, matching exactly this shape:
{
  "score": <number 0-100>,
  "confidence": "low" | "medium" | "high",
  "summary": "<2-3 sentences>",
  "targetSectors": ["...", "..."],
  "unresolvedRisks": ["...", "..."],
  "recommendedAdjustments": ["...", "..."],
  "whatWouldChangeTheVerdict": ["...", "..."]
}`;

function formatTranscript(transcript) {
  return transcript
    .filter((t) => t.agent === "advocate" || t.agent === "skeptic")
    .map((t) => `[${t.agent.toUpperCase()} — round ${t.round}]\n${t.content}`)
    .join("\n\n");
}

export async function arbiterNode(state) {
  const userPrompt = `MARKET CONTEXT
${formatMarketContext(state.marketContext)}

FULL DEBATE TRANSCRIPT
${formatTranscript(state.transcript)}

Deliver your final verdict now, as strict JSON.`;

  const raw = await callGroq({
    systemPrompt: ARBITER_SYSTEM_PROMPT,
    userPrompt,
    temperature: 0.3,
  });

  const fallback = {
    score: 50,
    confidence: "low",
    summary: "The Arbiter could not produce a structured verdict from this debate — treat this as inconclusive, not a real assessment.",
    targetSectors: [],
    unresolvedRisks: [],
    recommendedAdjustments: [],
    whatWouldChangeTheVerdict: [],
  };

  const parsed = safeParseJSON(raw, fallback);

  const verdict = {
    score: typeof parsed.score === "number" ? parsed.score : fallback.score,
    confidence: ["low", "medium", "high"].includes(parsed.confidence) ? parsed.confidence : fallback.confidence,
    summary: parsed.summary ?? fallback.summary,
    targetSectors: parsed.targetSectors ?? [],
    unresolvedRisks: parsed.unresolvedRisks ?? [],
    recommendedAdjustments: parsed.recommendedAdjustments ?? [],
    whatWouldChangeTheVerdict: parsed.whatWouldChangeTheVerdict ?? [],
  };

  return {
    ...state,
    verdict,
    transcript: [
      ...state.transcript,
      {
        agent: "arbiter",
        round: -1,
        content: verdict.summary,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}
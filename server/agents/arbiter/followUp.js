import { callGroq } from "./groqClient.js";

const FOLLOWUP_SYSTEM_PROMPT = `You are answering a follow-up question about a completed FundIQ Arbiter debate and verdict.

Rules:
- Answer ONLY using the transcript and verdict provided below. Do not introduce new facts, comparables, or opinions not already present in that material.
- If the answer is not supported by the material provided, say so plainly — do not guess or fabricate an answer.
- Where relevant, point to which agent (Advocate, Skeptic, Analyst, or Arbiter) said the thing you're referencing.
- Keep your answer under 150 words. Plain text only, no markdown.`;

function formatTranscriptForFollowUp(transcript) {
  return transcript
    .map((t) => `[${t.agent.toUpperCase()}${t.round >= 0 ? ` — round ${t.round}` : ""}]\n${t.content}`)
    .join("\n\n");
}

function formatVerdictForFollowUp(verdict) {
  if (!verdict) return "(no verdict available)";
  return [
    `Score: ${verdict.score} (${verdict.confidence} confidence)`,
    `Summary: ${verdict.summary}`,
    verdict.targetSectors?.length ? `Target sectors: ${verdict.targetSectors.join(", ")}` : "",
    verdict.unresolvedRisks?.length ? `Unresolved risks: ${verdict.unresolvedRisks.join("; ")}` : "",
    verdict.recommendedAdjustments?.length ? `Recommended adjustments: ${verdict.recommendedAdjustments.join("; ")}` : "",
    verdict.whatWouldChangeTheVerdict?.length ? `What would change the verdict: ${verdict.whatWouldChangeTheVerdict.join("; ")}` : "",
  ].filter(Boolean).join("\n");
}

export async function answerFollowUp({ transcript, verdict, question }) {
  const userPrompt = `DEBATE TRANSCRIPT
${formatTranscriptForFollowUp(transcript)}

FINAL VERDICT
${formatVerdictForFollowUp(verdict)}

QUESTION
${question}

Answer the question now, following the rules above.`;

  return callGroq({
    systemPrompt: FOLLOWUP_SYSTEM_PROMPT,
    userPrompt,
    temperature: 0.3,
  });
}
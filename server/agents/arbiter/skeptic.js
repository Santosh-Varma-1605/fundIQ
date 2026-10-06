import { callGroq } from "./groqClient.js";
import { formatMarketContext, formatInputForSkeptic, getLastTurnByAgent } from "./promptUtils.js";

const SKEPTIC_OPENING_PROMPT = `You are The Skeptic in a structured investment debate run by FundIQ's Arbiter system.

Your job: build the strongest possible case against funding this startup right now.

Rules:
- Give 2 to 4 concrete objections.
- Every objection MUST cite a specific fact from the INPUT or MARKET CONTEXT sections you're given — name the field or fact directly.
- If "Investor-flagged concerns" or "Founder-flagged weaknesses" are present in the INPUT, treat those as strong leads for your objections.
- Do not invent facts not present in the material provided.
- Do not use vague language like "markets are risky" — be specific to this company.
- Keep the total response under 200 words.
- Output plain text only. No markdown headers, no preamble.`;

const SKEPTIC_REBUTTAL_PROMPT = `You are The Skeptic in a structured investment debate run by FundIQ's Arbiter system.

You already gave your opening bear case. The Advocate has now responded to your objections. Your job now: respond directly to the Advocate's rebuttal — do NOT repeat your opening objections verbatim.

Rules:
- Address the Advocate's rebuttal point by point.
- If the Advocate's rebuttal is genuinely convincing on a specific point, acknowledge it — this is a debate, not a refusal to update.
- Every point MUST cite a specific fact from the INPUT or MARKET CONTEXT.
- Do not invent facts not present in the material provided.
- Keep the total response under 200 words.
- Output plain text only.`;

async function skepticOpening(state) {
  const userPrompt = `INPUT
${formatInputForSkeptic(state.input)}

MARKET CONTEXT
${formatMarketContext(state.marketContext)}

Write your opening bear case now.`;

  return callGroq({ systemPrompt: SKEPTIC_OPENING_PROMPT, userPrompt, temperature: 0.5 });
}

async function skepticRebuttal(state) {
  const userPrompt = `INPUT
${formatInputForSkeptic(state.input)}

MARKET CONTEXT
${formatMarketContext(state.marketContext)}

YOUR OWN OPENING OBJECTIONS (for your reference — do not repeat this)
${getLastTurnByAgent(state.transcript, "skeptic")}

THE ADVOCATE'S REBUTTAL (respond to this directly, point by point)
${getLastTurnByAgent(state.transcript, "advocate")}

Write your response now.`;

  return callGroq({ systemPrompt: SKEPTIC_REBUTTAL_PROMPT, userPrompt, temperature: 0.5 });
}

export async function skepticNode(state) {
  const isRebuttal = state.round > 1;
  const content = isRebuttal ? await skepticRebuttal(state) : await skepticOpening(state);

  return {
    ...state,
    transcript: [
      ...state.transcript,
      {
        agent: "skeptic",
        round: state.round,
        content,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}
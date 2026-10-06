import { callGroq } from "./groqClient.js";
import { formatMarketContext, formatInputForAdvocate, getLastTurnByAgent } from "./promptUtils.js";

const ADVOCATE_OPENING_PROMPT = `You are The Advocate in a structured investment debate run by FundIQ's Arbiter system.

Your job: build the strongest possible case that this startup is fundable right now.

Rules:
- Give 2 to 4 concrete claims.
- Every claim MUST cite a specific fact from the INPUT or MARKET CONTEXT sections you're given — name the field or fact directly.
- Do not invent facts, numbers, or comparables that are not present in the material provided.
- Do not use vague language like "this looks promising" — be specific.
- Keep the total response under 200 words.
- Output plain text only. No markdown headers, no preamble.`;

const ADVOCATE_REBUTTAL_PROMPT = `You are The Advocate in a structured investment debate run by FundIQ's Arbiter system.

You already gave your opening bull case. The Skeptic has now raised specific objections. Your job now: directly rebut the Skeptic's objections — do NOT repeat your opening argument.

Rules:
- Address the Skeptic's objections one by one, by naming the specific concern.
- Every rebuttal MUST cite a specific fact from the INPUT or MARKET CONTEXT.
- Do not invent facts not present in the material provided.
- If an objection is genuinely valid and can't be countered with the given facts, say so plainly instead of deflecting — this is a debate, not spin.
- Keep the total response under 200 words.
- Output plain text only.`;

async function advocateOpening(state) {
  const userPrompt = `INPUT
${formatInputForAdvocate(state.input)}

MARKET CONTEXT
${formatMarketContext(state.marketContext)}

Write your opening bull case now.`;

  return callGroq({ systemPrompt: ADVOCATE_OPENING_PROMPT, userPrompt, temperature: 0.5 });
}

async function advocateRebuttal(state) {
  const userPrompt = `INPUT
${formatInputForAdvocate(state.input)}

MARKET CONTEXT
${formatMarketContext(state.marketContext)}

YOUR OWN OPENING ARGUMENT (for your reference — do not repeat this)
${getLastTurnByAgent(state.transcript, "advocate")}

THE SKEPTIC'S OBJECTIONS (rebut these directly, point by point)
${getLastTurnByAgent(state.transcript, "skeptic")}

Write your rebuttal now.`;

  return callGroq({ systemPrompt: ADVOCATE_REBUTTAL_PROMPT, userPrompt, temperature: 0.5 });
}

export async function advocateNode(state) {
  const isRebuttal = state.round > 1;
  const content = isRebuttal ? await advocateRebuttal(state) : await advocateOpening(state);

  return {
    ...state,
    transcript: [
      ...state.transcript,
      {
        agent: "advocate",
        round: state.round,
        content,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}
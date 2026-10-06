import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is missing from the environment. Add it to server/.env.");
}

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const MODELS = {
  default: "openai/gpt-oss-120b",
};

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Groq call timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export async function callGroq({ systemPrompt, userPrompt, temperature = 0.4, model = MODELS.default }) {
  const attempt = async () => {
    const completion = await withTimeout(
      client.chat.completions.create({
        model,
        temperature,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      30000
    );

    const text = completion?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("Groq returned an empty completion.");
    }
    return text;
  };

  try {
    return await attempt();
  } catch (err) {
    console.warn(`[groqClient] first attempt failed (${err.message}), retrying once...`);
    await new Promise((r) => setTimeout(r, 2000));
    return attempt();
  }
}
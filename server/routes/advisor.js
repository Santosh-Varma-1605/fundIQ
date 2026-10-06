import express from "express";
import Groq from "groq-sdk";

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert investment advisor AI embedded in FundIQ.

Always structure your responses with:
1. Current macro context
2. Risk assessment (Low / Medium / High)
3. Recommendation
4. Caveats

Keep responses concise (150–250 words). End with a disclaimer.`;

router.post("/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map(m => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      ],
      temperature: 0.7,
    });

    res.json({
      reply: completion.choices[0].message.content,
    });

  } catch (err) {
    console.error("Groq Error:", err);
    res.status(500).json({ error: "Groq request failed" });
  }
});

export default router;
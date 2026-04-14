import express from "express";
import OpenAI from "openai";

const router = express.Router();
let client;

function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

function fallbackInsight(message, market = []) {
  const leaders = market
    .slice(0, 3)
    .map((coin) => `${coin.name}: ${Number(coin.change24h || 0).toFixed(2)}% in 24h`)
    .join(", ");

  return [
    `I can help with that. You asked: "${message}".`,
    leaders ? `Live snapshot: ${leaders}.` : "Live market context was not included in this request.",
    "Use this as research support, not financial advice. Check risk, position size, and your time horizon before acting.",
  ].join(" ");
}

router.post("/", async (req, res) => {
  try {
    const { message, market = [], portfolio = [], alerts = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Ask a question first." });
    }

    const openai = getClient();
    if (!openai) {
      return res.json({
        reply: fallbackInsight(message, market),
        mode: "fallback",
      });
    }

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are CryptoGuardian AI, a concise crypto research assistant. Use provided live market, portfolio, and alert data. Be practical, flag risk clearly, and never claim certainty or provide guaranteed financial advice.",
        },
        {
          role: "user",
          content: JSON.stringify({
            question: message,
            liveMarket: market,
            portfolio,
            alerts,
          }),
        },
      ],
      max_output_tokens: 450,
    });

    res.json({
      reply: response.output_text || "I could not generate an answer right now.",
      mode: "openai",
    });
  } catch (error) {
    res.status(500).json({
      error: "AI assistance failed. Check OPENAI_API_KEY and server logs.",
      reply: fallbackInsight(req.body?.message || "Market question", req.body?.market || []),
      mode: "fallback",
    });
  }
});

export default router;

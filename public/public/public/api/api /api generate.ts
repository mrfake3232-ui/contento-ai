import type { VercelRequest, VercelResponse } from "@vercel/node";

const MAX_FIELD = 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // The key lives ONLY here on the server (Vercel Environment Variables).
  // If it is missing, we answer 501 and the app shows a clear Demo Mode.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(501).json({ error: "AI is not configured" });
  }

  const b = req.body || {};
  const clean = (v: unknown) =>
    typeof v === "string" ? v.trim().slice(0, MAX_FIELD) : "";

  const productName = clean(b.productName);
  const description = clean(b.description);
  const audience = clean(b.audience);
  const platform = clean(b.platform);
  const language = clean(b.language);
  const tone = clean(b.tone);

  if (!productName || !description) {
    return res
      .status(400)
      .json({ error: "Product name and description are required." });
  }

  const prompt = `You are an expert marketing copywriter.
Write marketing content in this language: ${language || "English"}.
Tone: ${tone || "friendly"}.
Platform: ${platform || "Instagram"}.

Product name: ${productName}
Description: ${description}
Target audience: ${audience || "general audience"}

Return ONLY valid JSON, with no extra text and no markdown, in exactly this shape:
{"caption": "...", "productDescription": "...", "adCopy": "..."}

- caption: an engaging post caption for the platform, with fitting emojis and hashtags if the platform uses them.
- productDescription: a polished product description of 2-4 sentences.
- adCopy: a short, punchy advertising text (max 2 sentences).`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!r.ok) {
      return res
        .status(502)
        .json({ error: "The AI service had a problem. Please try again." });
    }

    const data = await r.json();
    const text: string = data?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return res
        .status(502)
        .json({ error: "The AI answer was not readable. Please try again." });
    }

    const parsed = JSON.parse(match[0]);
    return res.status(200).json({
      caption: String(parsed.caption ?? ""),
      productDescription: String(parsed.productDescription ?? ""),
      adCopy: String(parsed.adCopy ?? ""),
    });
  } catch {
    return res
      .status(500)
      .json({ error: "Server error. Please try again." });
  }
}

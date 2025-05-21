// pages/api/generate-icps.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Missing title or description" });
  }

  const prompt = `
You're an expert in user research and product marketing.

Based on the following product:

Project Name: ${title}
Description: ${description}

List 5 to 10 Ideal Customer Profiles (ICPs) — types of people or professionals who would benefit most from this product.

Return only the list in JSON array format. No explanation or additional text.

Example:
["Freelancers", "Remote team managers", "HR professionals", "Small business owners"]
`;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error("OpenAI Error:", data);
      return res.status(500).json({ error: "OpenAI API failed", detail: data });
    }

    const content = data.choices?.[0]?.message?.content || "[]";

    // Tentar fazer parse seguro
    let icps: string[] = [];
    try {
      icps = JSON.parse(content);
    } catch (e) {
      // fallback: tentar processar como lista textual
      icps = content
        .split("\n")
        .map((line: string) => line.replace(/^\d+\.\s*/, "").replace(/["\[\]]/g, "").trim())
        .filter(Boolean);
    }

    res.status(200).json({ icps });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
}

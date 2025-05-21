import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { title, description, icps } = req.body;

  console.log("🔍 [generate-queries] Incoming request...");
  console.log("📌 Title:", title);
  console.log("📌 Description:", description);
  console.log("🎯 ICPs:", icps);

  if (!description || !Array.isArray(icps)) {
    console.warn("⚠️ Missing description or icps");
    return res.status(400).json({ error: "Missing required fields: description or icps" });
  }

  const prompt = `
You're an expert in online user acquisition. Based on the following product, suggest 10 search queries that people in the target audience might post on Google, Reddit, or Quora to find solutions this product addresses.

Product: "${title}"
Description: "${description}"
Target audience: ${icps.join(", ")}

Return a plain JSON array of strings like:
["how to manage employee time", "tools for remote team coordination"]
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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

    const json = await response.json();

    if (!response.ok) {
      console.error("❌ OpenAI API error:", json);
      return res.status(500).json({ error: "OpenAI API error", detail: json });
    }

    const content = json.choices?.[0]?.message?.content || "[]";

    console.log("🧠 Raw OpenAI response content:", content);

    let queries: string[] = [];

    try {
      queries = JSON.parse(content);
    } catch (err) {
      console.error("❌ Failed to parse OpenAI response as JSON:", err);
      return res.status(500).json({ error: "Failed to parse OpenAI response" });
    }

    console.log("✅ Final queries:", queries);
    res.status(200).json({ queries });
  } catch (err) {
    console.error("❌ Failed to generate queries:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
}

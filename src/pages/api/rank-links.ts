import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { results, name, description, query_icp } = req.body;

  if (!Array.isArray(results) || results.length === 0) {
    return res.status(400).json({ error: "Missing or invalid results array" });
  }

  // ✅ Deduplicar por URL e filtrar válidos
  const uniqueResults = Array.from(
    new Map(results.map(item => [item.url, item])).values()
  ).filter(item => item?.url?.startsWith("http"));

  // ✅ Agrupar por site (só para stats ou se quiseres logar depois)
  const counts = {
    Reddit: uniqueResults.filter(r => r.site === "Reddit").length,
    Twitter: uniqueResults.filter(r => r.site === "Twitter").length,
    Quora: uniqueResults.filter(r => r.site === "Quora").length,
  };
  console.log("🔢 Post counts by site:", counts);

  const prompt = `
You're helping a startup evaluate online discussions to identify those that are most relevant for customer discovery and early traction.

The startup is building: "${name}"  
Description: "${description}"  
Target audience: ${JSON.stringify(query_icp)}

Given the following list of forum posts (each with site, title, summary, and URL), pick the **top 50 posts** that would be **most valuable for this startup to engage with** — based on their relevance to the product and its audience.

Prioritize discussions where the startup can learn about users' problems, validate their solution, or connect with potential users.

⚠️ Requirements:
- Ensure **source diversity**: aim for a balanced mix of Reddit, Twitter, and Quora posts — even if there are more from one source, try to represent all three as equally as possible.
- Avoid **duplicate URLs**.
- Return a valid JSON array of objects like:
[
  { "ranking": 1, "site": "Reddit", "url": "https://..." },
  ...
]
No explanations, just the array.

Forum posts:
${JSON.stringify(uniqueResults, null, 2)}
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
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      console.error("❌ OpenAI API error:", await response.text());
      return res.status(500).json({ error: "OpenAI API error" });
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content || "[]";

    console.log("🧠 Raw OpenAI ranking response:", content);

    let ranked: any[] = [];
    try {
      ranked = JSON.parse(content);
    } catch (err) {
      console.error("❌ Failed to parse OpenAI response", err);
      return res.status(500).json({ error: "Failed to parse OpenAI response" });
    }

    // ✅ Deduplicação final
    const dedupedRanked = Array.from(
      new Map(ranked.map(item => [item.url, item])).values()
    ).filter(item => item?.url?.startsWith("http"));

    res.status(200).json({ ranked: dedupedRanked });
  } catch (err) {
    console.error("❌ Ranking failed:", err);
    res.status(500).json({ error: "Ranking request failed" });
  }
}

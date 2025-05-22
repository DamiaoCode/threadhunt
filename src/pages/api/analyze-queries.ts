import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabase";

const SERPER_API_KEY = process.env.SERPER_API_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const SITES = ["reddit", "quora", "stackoverflow"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { projectId, queries, description } = req.body;

  if (!queries || !Array.isArray(queries) || !projectId || !description) {
    return res.status(400).json({ error: "Missing queries, description or projectId" });
  }

  try {
    console.log("▶️ Starting discovery...");
    console.log("🔎 Queries:", queries);
    console.log("📝 Description:", description);

    const groupedResults: Record<string, any[]> = {
      reddit: [],
      quora: [],
      stackoverflow: [],
    };

    for (const query of queries) {
      for (const site of SITES) {
        const searchQuery = `${query} ${site}`;
        console.log(`🔍 Pesquisando: ${searchQuery}`);

        const response = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": SERPER_API_KEY,
          },
          body: JSON.stringify({ q: searchQuery, num: 10 }),
        });

        const json = await response.json();
        console.log(`📄 Resposta da API para "${searchQuery}":`, JSON.stringify(json, null, 2));

        const items = json.organic || [];

        for (const item of items) {
          if (item.link?.includes(site)) {
            groupedResults[site].push({
              title: item.title,
              snippet: item.snippet,
              link: item.link,
              query,
            });
          }
        }
      }
    }

    console.log("✅ Total results collected:", {
      reddit: groupedResults.reddit.length,
      quora: groupedResults.quora.length,
      stackoverflow: groupedResults.stackoverflow.length,
    });

    // 🧠 Pedir ao GPT para classificar sem inventar
    const prompt = `
We have a product idea:
"${description}"

And we collected forum posts from three sites (reddit, quora, stackoverflow). Each post includes:
- title
- snippet
- link
- the original query that triggered it

Return a new JSON object with up to **10 most relevant** posts per site (based on relevance to the product idea), without inventing or modifying anything.

Respond ONLY with valid JSON like this:

\`\`\`json
{
  "reddit": [ { "title": "...", "link": "...", "snippet": "...", "query": "..." }, ... ],
  "quora": [...],
  "stackoverflow": [...]
}
\`\`\`
`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        temperature: 0.3,
        messages: [
          { role: "system", content: "You are a helpful assistant that only reorganizes data." },
          { role: "user", content: prompt },
          { role: "user", content: JSON.stringify(groupedResults) },
        ],
      }),
    });

    const gptData = await openaiRes.json();
    const content = gptData.choices?.[0]?.message?.content || "";

    const match = content.match(/```json([\s\S]*?)```/);
    const rawJson = match?.[1]?.trim();

    if (!rawJson) {
      console.error("⚠️ JSON not found in GPT response:", content);
      return res.status(500).json({ error: "Could not extract JSON from GPT" });
    }

    const parsedJson = JSON.parse(rawJson);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user.id;

    const { error } = await supabase
      .from("projects")
      .update({ discovery_results: parsedJson })
      .eq("id", projectId)
      .eq("user_id", userId);

    if (error) {
      console.error("❌ Supabase update error:", error);
      return res.status(500).json({ error: "Failed to save results to Supabase" });
    }

    console.log("✅ Discovery results saved to Supabase!");
    return res.status(200).json({ success: true, data: parsedJson });
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

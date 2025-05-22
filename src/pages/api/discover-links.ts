// pages/api/discover-links.ts
import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabase";

const SERPER_API_KEY = process.env.SERPER_API_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const SITES = ["reddit", "quora", "stackoverflow"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { projectId, queries, description } = req.body;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user.id; 

  if (!queries || !Array.isArray(queries) || !projectId || !description) {
    return res.status(400).json({ error: "Missing queries, description or projectId" });
  }

  try {
    const allResults: any[] = [];
    console.log("▶️ Starting discovery...");
    console.log("🔎 Queries:", queries);
    console.log("📝 Description:", description);

    for (const query of queries) {
      for (const site of SITES) {
        const searchQuery = `${query} ${site}`;
        console.log(`🌐 Querying Serper: "${searchQuery}"`);

        const response = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": SERPER_API_KEY,
          },
          body: JSON.stringify({ q: searchQuery, tbs: "qdr:m" }),
        });

        const json = await response.json();
        console.log(`📡 Serper response for ${site}:`, JSON.stringify(json, null, 2));

        const items = json.organic || [];

        for (const item of items) {
          if (item.link?.includes(site)) {
            allResults.push({
              site,
              query,
              title: item.title,
              snippet: item.snippet,
              link: item.link,
            });
          }
        }
      }
    }

    console.log(`✅ Total results collected: ${allResults.length}`);

    const prompt = `
Given the following product idea:
"${description}"

And a list of forum posts (title, snippet, link, site):

${allResults.map((r, i) =>
  `${i + 1}. [${r.site}] ${r.title}\n${r.snippet}\n${r.link}`
).join("\n\n")}

From the list above, select only the links that already exist and were found via search.

Do NOT invent any content, title, link or snippet. Only reorganize what is already there.

Pick up to 20 of the most relevant results per site (reddit, quora, stackoverflow), and group them clearly by site.

Return ONLY a valid JSON object inside a markdown code block like this:

\`\`\`json
{
  "reddit": [ { "title": "...", "link": "...", "snippet": "..." }, ... ],
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
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }],
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

    const { error } = await supabase
      .from("projects")
      .update({ discovery_results: parsedJson })
      .eq("id", projectId)
      .eq("user_id", userId); // ✅ NECESSÁRIO com RLS


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

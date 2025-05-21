// pages/api/process-discovery.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { scrapeSites } from "@/lib/scrapeSites";
import supabase from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { id, name, description, query_icp } = req.body;

  if (!id || !name || !description || !Array.isArray(query_icp)) {
    return res.status(400).json({ error: "Missing project fields" });
  }

  console.log("🚀 Starting discovery for:", id);

  // 1. Generate queries
  const queryRes = await fetch(`${req.headers.origin}/api/generate-queries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: name, description, icps: query_icp }),
  });
  const { queries } = await queryRes.json();
  console.log("📥 Queries received:", queries);

  // 2. Scrape platforms
  const scraped = await scrapeSites(queries);
  console.log("🔎 Total scraped results:", scraped.length);

  // 3. Filter Twitter profiles as potential competitors
  const competitors = scraped.filter(
    (item) => item.site === "Twitter" && /^https:\/\/twitter\.com\/[^/]+$/.test(item.url)
  );

  const filteredResults = scraped.filter(
    (item) => !(item.site === "Twitter" && /^https:\/\/twitter\.com\/[^/]+$/.test(item.url))
  );

  console.log(`🧑‍💼 Found ${competitors.length} potential competitors (Twitter profiles)`);
  console.log(`🔍 Proceeding to rank ${filteredResults.length} remaining results`);

  // 4. Rank links
  const rankRes = await fetch(`${req.headers.origin}/api/rank-links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      results: filteredResults,
      name,
      description,
      query_icp,
    }),
  });

  const { ranked } = await rankRes.json();
  console.log("🏆 Ranked results:", ranked.length);

  // 5. Save to Supabase
  const { error } = await supabase
    .from("projects")
    .update({
      discovery_results: ranked,
      possible_competitors: competitors,
    })
    .eq("id", id);

  if (error) {
    console.error("❌ Failed to save to Supabase", error.message);
    return res.status(500).json({ error: "Failed to save to Supabase" });
  }

  console.log("✅ Saved discovery + competitors for project", id);
  res.status(200).json({ success: true });
}

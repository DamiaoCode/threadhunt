import type { NextApiRequest, NextApiResponse } from "next";
import { scrapeSites } from "@/lib/scrapeSites";
import { getServiceSupabaseClient } from "@/lib/getServiceSupabaseClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id, name, description, query_icp } = req.body;

  if (!id || !name || !description || !Array.isArray(query_icp)) {
    return res.status(400).json({ error: "Missing project fields" });
  }

  const supabase = getServiceSupabaseClient(req, res);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    console.error("❌ Auth failed", authError?.message);
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user_id = user.id;
  console.log("🆔 Authenticated user:", user_id);
  console.log("🚀 Starting discovery for project ID:", id);

  // 1. Generate queries
  const queryRes = await fetch(`${req.headers.origin}/api/generate-queries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: name, description, icps: query_icp }),
  });

  const { queries } = await queryRes.json();
  if (!Array.isArray(queries) || queries.length === 0) {
    return res.status(400).json({ error: "Failed to generate queries" });
  }

  console.log("📥 Queries received:", queries);

  // 2. Scrape platforms
  const scraped = await scrapeSites(queries);
  console.log("🔎 Total scraped results:", scraped.length);

  if (scraped.length === 0) {
    return res.status(400).json({ error: "No scraped results found" });
  }

  // 3. Extract Twitter competitors
  const competitors = scraped.filter(
    (item) => item.site === "Twitter" && /^https:\/\/twitter\.com\/[^/]+$/.test(item.url)
  );

  const filteredResults = scraped.filter((item) => !competitors.includes(item));

  // ✅ Deduplicar por URL (reforço, mesmo após o scrape)
  const uniqueResults = Array.from(
    new Map(filteredResults.map(item => [item.url, item])).values()
  );

  // ✅ Limitar para 100 links para ranking
  const slicedResults = uniqueResults.slice(0, 100);

  console.log(`🧑‍💼 Twitter competitors: ${competitors.length}`);
  console.log(`🔍 Proceeding to rank ${slicedResults.length} results`);

  // 4. Rank links
  const rankRes = await fetch(`${req.headers.origin}/api/rank-links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      results: slicedResults,
      name,
      description,
      query_icp,
    }),
  });

  if (!rankRes.ok) {
    const errorText = await rankRes.text();
    console.error("❌ Rank API failed", errorText);
    return res.status(500).json({ error: "Failed to rank links", details: errorText });
  }

  const { ranked } = await rankRes.json();

  if (!Array.isArray(ranked)) {
    return res.status(500).json({ error: "Invalid ranked data returned" });
  }

  console.log("🏆 Ranked results:", ranked.length);

  // 5. Update project
  const { data: updateData, error: updateError } = await supabase
    .from("projects")
    .update({
      discovery_results: ranked,
      possible_competitors: competitors,
    })
    .eq("id", id)
    .eq("user_id", user_id)
    .select();

  if (updateError) {
    console.error("❌ Failed to save to Supabase", updateError);
    return res.status(500).json({ error: "Failed to update project", details: updateError });
  }

  if (!updateData || updateData.length === 0) {
    console.warn("⚠️ No rows updated — RLS may be blocking update");
    return res.status(404).json({ error: "No matching project found" });
  }

  console.log("✅ Saved discovery + competitors for project", id);
  return res.status(200).json({ success: true });
}

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

  // Auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user?.id) {
    console.error("❌ Auth failed", authError?.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user_id = user.id;

  // 1. Generate queries
  const queryRes = await fetch(`${req.headers.origin}/api/generate-queries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: name, description, icps: query_icp }),
  });
  const { queries } = await queryRes.json();

  // 2. Scrape platforms
  const scraped = await scrapeSites(queries);
  console.log("🔎 Total scraped results:", scraped.length);

  // 2a. Save scraped results into original_query JSONB
  {
    const { data: saveData, error: saveError } = await supabase
      .from("projects")
      .update({ original_query: scraped })
      .eq("id", id)
      .eq("user_id", user_id)
      .select();
    if (saveError) {
      console.error("❌ Failed to save scraped info:", saveError);
      return res.status(500).json({ error: "Could not save scraped info", details: saveError });
    }
    if (!saveData || saveData.length === 0) {
      console.warn("⚠️ No rows updated when saving scraped info");
      return res.status(404).json({ error: "Project not found when saving scraped info" });
    }
    console.log("✅ Scraped info saved:", saveData);
  }

  // 3. Extract Twitter competitors
  const competitors = scraped.filter(
    (item) => item.site === "Twitter" && /^https:\/\/twitter\.com\/[^/]+$/.test(item.url)
  );
  const filteredResults = scraped.filter((item) => !competitors.includes(item));

  // 4. Rank links
  const rankRes = await fetch(`${req.headers.origin}/api/rank-links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ results: filteredResults, name, description, query_icp }),
  });
  const { ranked } = await rankRes.json();

  // 5. Update project with discovery_results + possible_competitors
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

  // 6. Log this hunt run
  {
    const { error: logError } = await supabase
      .from("hunt_logs")
      .insert([{ user_id, project_id: id }]);
    if (logError) {
      console.error("❌ Failed to write hunt log:", logError);
      // we don't block the response if logging fails
    } else {
      console.log("✅ Hunt log created for user", user_id, "project", id);
    }
  }

  return res.status(200).json({ success: true });
}

export const config = {
  maxDuration: 60, // seconds
};

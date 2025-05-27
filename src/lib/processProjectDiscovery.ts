import { scrapeSites } from "./scrapeSites"; // ✅ must be imported
// pages/api/process-discovery.ts
import supabase from "@/lib/supabase";

export async function processProjectDiscovery(project: {
  id: number;
  name: string;
  description: string;
  query_icp: string[];
  user_id: string; // 👈 já vem passado
}) {
  console.log("🚀 Processing project discovery for", project.id);

  // 1. Generate queries
  const queryRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-queries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: project.name,
      description: project.description,
      icps: project.query_icp,
    }),
  });

  const { queries } = await queryRes.json();
  console.log("📥 Queries received:", queries);

  // 2. Scrape platforms (now passes project.id for original_query save)
  const scraped = await scrapeSites(queries, project.id);
  console.log("🔎 Total scraped results:", scraped.length);

  // 3. Rank links
  const rankRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/rank-links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ results: scraped }),
  });

  const { ranked } = await rankRes.json();
  console.log("🏆 Ranked results:", ranked.length);

  // ✅ 4. Save to Supabase
  const { error } = await supabase
    .from("projects")
    .update({ discovery_results: ranked })
    .eq("id", project.id)
    .eq("user_id", project.user_id); // ✅ usa o que já foi passado

  if (error) {
    console.error("❌ Failed to save to Supabase", error.message);
  } else {
    console.log("✅ Discovery results saved to Supabase");
  }
}

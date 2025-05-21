import { scrapeSites } from "./scrapeSites"; // ✅ must be imported

export async function processProjectDiscovery(project: {
  id: number;
  name: string;
  description: string;
  query_icp: string[];
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

  // ✅ 2. Scrape platforms
  const scraped = await scrapeSites(queries);
  console.log("🔎 Total scraped results:", scraped.length);

  // ✅ 3. Rank links
  const rankRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/rank-links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ results: scraped }),
  });

  const { ranked } = await rankRes.json();
  console.log("🏆 Ranked results:", ranked.length);

  // ✅ 4. Save to Supabase
  const supabase = (await import("@/lib/supabase")).default;
  await supabase
    .from("projects")
    .update({ discovery_results: ranked })
    .eq("id", project.id);

  console.log("✅ Discovery results saved to Supabase");
}

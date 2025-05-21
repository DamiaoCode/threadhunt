export async function scrapeSites(queries: string[]) {
  const allResults: any[] = [];

  for (const query of queries) {
    console.log(`🔍 Searching for: "${query}"`);

    const reddit = await searchReddit(query);
    console.log(`🟥 Reddit: found ${reddit.length} results`);

    const twitter = await searchSerper(query, "twitter");
    console.log(`🟦 Twitter: found ${twitter.length} results`);

    const quora = await searchSerper(query, "quora");
    console.log(`🟫 Quora: found ${quora.length} results`);

    allResults.push(...reddit, ...twitter, ...quora);
  }

  console.log(`✅ Total combined results: ${allResults.length}`);
  return allResults;
}

// Reddit
async function searchReddit(query: string) {
  try {
    const res = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=5`);
    const json = await res.json();

    return json.data.children.map((item: any) => ({
      site: "Reddit",
      title: item.data.title,
      url: `https://reddit.com${item.data.permalink}`,
      summary: "",
    }));
  } catch (err) {
    console.error(`❌ Reddit fetch failed for "${query}"`, err);
    return [];
  }
}

// Serper API for Twitter or Quora
async function searchSerper(query: string, platform: "twitter" | "quora") {
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env.SERPER_API_KEY!,
      },
      body: JSON.stringify({
        q: `${query} site:${platform}.com`,
        gl: "us",
        hl: "en",
      }),
    });

    const json = await res.json();
    const results = json.organic || [];

    return results.map((item: any) => ({
      site: platform === "twitter" ? "Twitter" : "Quora",
      title: item.title,
      url: item.link,
      summary: item.snippet || "",
    }));
  } catch (err) {
    console.error(`❌ Serper ${platform} fetch failed for "${query}"`, err);
    return [];
  }
}

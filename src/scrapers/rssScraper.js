
import Parser from "rss-parser";
import fetch from "node-fetch";
import { load } from "cheerio";

const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["dc:date", "dcDate"]
    ]
  }
});


function cleanText(text = "") {
  return text
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}


async function fetchFullContent(articleUrl) {
  try {
    const res = await fetch(articleUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
      },
      timeout: 15000
    });

    if (!res.ok) return "";

    const html = await res.text();
    const $ = load(html);

    const selectors = [
      "article p",
      ".article-content p",
      ".post-content p",
      ".entry-content p",
      ".content p",
      "#content p"
    ];

    let paragraphs = [];

    for (const sel of selectors) {
      $(sel).each((_, el) => {
        const t = cleanText($(el).text());
        if (t.length > 50) paragraphs.push(t);
      });

      if (paragraphs.length >= 5) break;
    }

    return paragraphs.join("\n\n");
  } catch {
    return "";
  }
}

export async function scrapeRSS(source) {
  console.log(`[${source.name}] Fetching RSS…`);

  let feed;

  try {
    feed = await parser.parseURL(source.url);
  } catch (err) {
    console.error(`Failed to fetch RSS for ${source.name}:`, err.message);
    return [];
  }

  const items = [];

  for (const entry of feed.items ?? []) {
    const title = cleanText(entry.title || "");
    const link = cleanText(entry.link || entry.guid || "");

    if (!title || !link) continue;

    const date =
      entry.isoDate ||
      entry.pubDate ||
      entry.dcDate ||
      entry.published ||
      "";


    let fullContent = await fetchFullContent(link);

    if (!fullContent || fullContent.length < 100) {
      fullContent =
        cleanText(entry.contentEncoded) ||
        cleanText(entry.content) ||
        cleanText(entry.summary) ||
        cleanText(entry.contentSnippet) ||
        "";
    }

    items.push({
      title,
      link,
      content: fullContent,
      date,
      source: source.name
    });
  }

  console.log(
    `✔️ ${source.name}: Extracted ${items.length} items with FULL content`
  );

  return items;
}

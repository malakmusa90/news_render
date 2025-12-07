import fs from "fs/promises";
import path from "path";
import cron from "node-cron";
import sources from "./config/rssSources.js";
import { scrapeRSS } from "./scrapers/rssScraper.js";

const ALL_NEWS_FILE = path.resolve("./data/all_news.json");
const LAST_DATES_FILE = path.resolve("./data/last_dates.json");


async function ensureFiles() {
  await fs.mkdir("./data", { recursive: true });

  try { await fs.access(ALL_NEWS_FILE); }
  catch { await fs.writeFile(ALL_NEWS_FILE, "[]"); }

  try { await fs.access(LAST_DATES_FILE); }
  catch { await fs.writeFile(LAST_DATES_FILE, "{}"); }
}


async function loadJSON(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return Array.isArray(file) ? [] : {};
  }
}


async function saveJSON(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

async function fetchAll() {
  await ensureFiles();

  let allNews = await loadJSON(ALL_NEWS_FILE);
  let lastDates = await loadJSON(LAST_DATES_FILE);

  console.log("\n====================================================");
  console.log(`🟦 Fetch cycle started: ${new Date().toISOString()}`);
  console.log("====================================================");

  let totalNew = 0;

  for (const source of sources) {
    console.log(`\n🌐 Fetching from: ${source.name}`);

    const items = await scrapeRSS(source);

    console.log(`📥 Extracted: ${items.length} items from ${source.name}`);

    const lastSourceDate = lastDates[source.name] || "1970-01-01T00:00:00Z";
    let added = 0;

    for (const item of items) {
      if (!item.date) continue;

      const itemDate = new Date(item.date).getTime();
      const lastDate = new Date(lastSourceDate).getTime();


      if (itemDate > lastDate) {
        allNews.push(item);
        added++;
        totalNew++;

    
        if (!lastDates[source.name] || item.date > lastDates[source.name]) {
          lastDates[source.name] = item.date;
        }
      }
    }

    console.log(`   ✔ New items added from ${source.name}: ${added}`);
  }


  await saveJSON(ALL_NEWS_FILE, allNews);
  await saveJSON(LAST_DATES_FILE, lastDates);

  console.log("\n====================================================");
  console.log(`💾 Saved all news!`);
  console.log(`📊 Total items stored in all_news.json: ${allNews.length}`);
  console.log(`🟩 New items added this cycle: ${totalNew}`);
  console.log("====================================================\n");
}

// التشغيل الفوري
fetchAll();

cron.schedule("*/3 * * * *", fetchAll);
console.log("🕒 RSS Fetcher scheduled every 3 minutes...");

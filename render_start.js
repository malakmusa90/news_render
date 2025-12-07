import { fetchAllRSS } from "./src/fetchAllRSS.js";

console.log("🚀 Render cron job started:", new Date().toISOString());

await fetchAllRSS();

console.log("✅ Render cron job finished:", new Date().toISOString());
process.exit(0);

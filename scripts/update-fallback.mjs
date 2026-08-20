import { writeFile } from "node:fs/promises";
import { parseCsv, rowsToObjects } from "../lib/csv.js";
import {
  normalizeRestaurants,
  normalizeShoppingSpots,
  normalizeSpots
} from "../lib/normalize.js";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1M99Q4xCDtrT9KLc7vHQNFeydUT6orVf_O0ARIvhnmUI";
const GIDS = {
  restaurants: process.env.GOOGLE_SHEET_RESTAURANTS_GID || "578914801",
  spots: process.env.GOOGLE_SHEET_SPOTS_GID || "485003184",
  shopping: process.env.GOOGLE_SHEET_SHOPPING_SPOTS_GID || "303701298"
};

async function fetchRows(gid) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const response = await fetch(url, {
    headers: { "User-Agent": "okinawa-now-fallback-sync/1.0" }
  });
  if (!response.ok) throw new Error(`Failed to fetch gid=${gid}: ${response.status}`);
  return rowsToObjects(parseCsv(await response.text()));
}

const [restaurantRows, spotRows, shoppingRows] = await Promise.all([
  fetchRows(GIDS.restaurants),
  fetchRows(GIDS.spots),
  fetchRows(GIDS.shopping)
]);

const places = [
  ...normalizeRestaurants(restaurantRows),
  ...normalizeSpots(spotRows),
  ...normalizeShoppingSpots(shoppingRows)
];

await writeFile(
  new URL("../data/fallback.json", import.meta.url),
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: "Google Sheets snapshot",
    sheetId: SHEET_ID,
    places
  }, null, 2)}\n`,
  "utf8"
);

console.log(`Updated fallback snapshot: ${places.length} places`);

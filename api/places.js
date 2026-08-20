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

async function fetchSheet(gid) {
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(SHEET_ID)}/export?format=csv&gid=${encodeURIComponent(gid)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "okinawa-now/1.0 (+https://github.com/thKimm/okinawa-now)",
      Accept: "text/csv,text/plain;q=0.9,*/*;q=0.1"
    }
  });

  if (!response.ok) {
    throw new Error(`Google Sheet fetch failed (${response.status})`);
  }

  const text = await response.text();
  return rowsToObjects(parseCsv(text));
}

function dedupe(places) {
  const seen = new Set();
  return places.filter((place) => {
    const key = `${place.kind}|${place.name}|${place.address}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
      const [restaurantRows, spotRows, shoppingRows] = await Promise.all([
        fetchSheet(GIDS.restaurants),
        fetchSheet(GIDS.spots),
        fetchSheet(GIDS.shopping)
      ]);

      const places = dedupe([
        ...normalizeRestaurants(restaurantRows),
        ...normalizeSpots(spotRows),
        ...normalizeShoppingSpots(shoppingRows)
      ]);

      return Response.json(
        {
          generatedAt: new Date().toISOString(),
          source: "google-sheets",
          sheetId: SHEET_ID,
          counts: {
            all: places.length,
            restaurants: places.filter((place) => place.kind === "restaurant").length,
            spots: places.filter((place) => place.kind === "spot").length,
            shopping: places.filter((place) => place.kind === "shop").length
          },
          places
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    } catch (error) {
      console.error(error);
      return Response.json(
        {
          error: "실시간 Google Sheet 데이터를 불러오지 못했습니다.",
          detail: error instanceof Error ? error.message : String(error)
        },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }
  }
};

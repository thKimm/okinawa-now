const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

async function search(query) {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "jp");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("accept-language", "ja,ko,en");
  url.searchParams.set("q", query);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "okinawa-now/1.0 (+https://github.com/thKimm/okinawa-now)",
      Accept: "application/json"
    }
  });

  if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);
  const results = await response.json();
  return results[0] || null;
}

export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const url = new URL(request.url);
    const name = (url.searchParams.get("name") || "").trim();
    const address = (url.searchParams.get("address") || "").trim();

    if (!name && !address) {
      return Response.json({ error: "name or address is required" }, { status: 400 });
    }

    try {
      let result = await search([name, address, "Okinawa Japan"].filter(Boolean).join(", "));
      if (!result && address) result = await search(`${address}, Japan`);
      if (!result && name) result = await search(`${name}, Okinawa, Japan`);

      if (!result) {
        return Response.json(
          { found: false },
          {
            status: 404,
            headers: { "Cache-Control": "public, s-maxage=86400" }
          }
        );
      }

      return Response.json(
        {
          found: true,
          lat: Number(result.lat),
          lng: Number(result.lon),
          displayName: result.display_name || ""
        },
        {
          headers: {
            "Cache-Control": "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800",
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    } catch (error) {
      console.error(error);
      return Response.json(
        { error: "위치 검색에 실패했습니다." },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }
  }
};

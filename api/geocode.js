export default {
  async fetch() {
    return Response.json(
      { error: "Geocoding is disabled. Okinawa Now uses stable stored/area coordinates and Google Maps for final navigation." },
      { status: 410, headers: { "Cache-Control": "public, max-age=86400" } }
    );
  }
};

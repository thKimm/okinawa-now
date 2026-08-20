export default {
  async fetch() {
    return Response.json(
      {
        error: "Runtime geocoding is disabled.",
        detail: "Okinawa Now uses cached/seeded coordinates and Google Maps for final navigation."
      },
      { status: 410, headers: { "Cache-Control": "public, s-maxage=86400" } }
    );
  }
};

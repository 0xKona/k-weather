import { http, HttpResponse } from "msw";

// Stub handlers for Open-Meteo APIs
export const handlers = [
  // Geocoding API
  http.get("https://geocoding-api.open-meteo.com/v1/search", ({ request }) => {
    const url = new URL(request.url);
    const name = url.searchParams.get("name");

    if (!name) {
      return HttpResponse.json({ results: [] });
    }

    return HttpResponse.json({
      results: [
        {
          id: 2643743,
          name: "London",
          latitude: 51.5085,
          longitude: -0.1257,
          country: "United Kingdom",
          timezone: "Europe/London",
        },
      ],
    });
  }),

  // Weather Forecast API
  http.get("https://api.open-meteo.com/v1/forecast", ({ request }) => {
    const url = new URL(request.url);
    const latitude = url.searchParams.get("latitude");
    const longitude = url.searchParams.get("longitude");

    if (!latitude || !longitude) {
      return HttpResponse.json(
        { error: true, reason: "Missing coordinates" },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      current_weather: {
        temperature: 18.5,
        windspeed: 12.3,
        winddirection: 220,
        weathercode: 2,
        is_day: 1,
        time: "2026-08-13T10:00",
      },
      daily: {
        time: ["2026-08-13"],
        sunrise: ["2026-08-13T05:47"],
        sunset: ["2026-08-13T20:17"],
      },
    });
  }),
];

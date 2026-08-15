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
      hourly: {
        time: [
          "2026-08-13T10:00",
          "2026-08-13T11:00",
          "2026-08-13T12:00",
          "2026-08-13T13:00",
          "2026-08-13T14:00",
          "2026-08-13T15:00",
          "2026-08-13T16:00",
          "2026-08-13T17:00",
          "2026-08-13T18:00",
          "2026-08-13T19:00",
          "2026-08-13T20:00",
          "2026-08-13T21:00",
        ],
        temperature_2m: [18.5, 19.2, 20.1, 21.0, 21.4, 22.0, 20.2, 19.0, 18.0, 17.2, 16.5, 15.9],
        weathercode: [2, 2, 1, 1, 0, 0, 1, 2, 3, 3, 2, 1],
        is_day: [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
      },
    });
  }),

  // BigDataCloud reverse geocoding
  http.get(
    "https://api.bigdatacloud.net/data/reverse-geocode-client",
    () => {
      return HttpResponse.json({
        city: "Testville",
        principalSubdivision: "Testshire",
        countryName: "Testland",
        countryCode: "TL",
      });
    }
  ),
];

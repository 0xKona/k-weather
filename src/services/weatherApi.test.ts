import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { server } from "@/__tests__/mocks/server";
import { http, HttpResponse } from "msw";
import { fetchWeather } from "./weatherApi";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("fetchWeather", () => {
  it("returns weather data for valid coordinates", async () => {
    const result = await fetchWeather(51.5085, -0.1257);

    expect(result).toEqual({
      latitude: 51.5085,
      longitude: -0.1257,
      current_weather: {
        temperature: 18.5,
        windspeed: 12.3,
        winddirection: 220,
        weathercode: 2,
        is_day: 1,
        time: "2026-08-13T10:00",
      },
    });
  });

  it("returns null when the API returns a 400 error", async () => {
    server.use(
      http.get("https://api.open-meteo.com/v1/forecast", () => {
        return HttpResponse.json(
          { error: true, reason: "Invalid coordinates" },
          { status: 400 }
        );
      })
    );

    const result = await fetchWeather(999, 999);
    expect(result).toBeNull();
  });

  it("returns null when the network request fails", async () => {
    server.use(
      http.get("https://api.open-meteo.com/v1/forecast", () => {
        return HttpResponse.error();
      })
    );

    const result = await fetchWeather(51.5, -0.1);
    expect(result).toBeNull();
  });

  it("passes latitude and longitude as query parameters", async () => {
    let capturedUrl = "";

    server.use(
      http.get("https://api.open-meteo.com/v1/forecast", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          latitude: 35.6762,
          longitude: 139.6503,
          current_weather: {
            temperature: 28.0,
            windspeed: 8.5,
            winddirection: 180,
            weathercode: 0,
            is_day: 1,
            time: "2026-08-13T18:00",
          },
        });
      })
    );

    await fetchWeather(35.6762, 139.6503);

    const url = new URL(capturedUrl);
    expect(url.searchParams.get("latitude")).toBe("35.6762");
    expect(url.searchParams.get("longitude")).toBe("139.6503");
  });

  it("requests current_weather in the query", async () => {
    let capturedUrl = "";

    server.use(
      http.get("https://api.open-meteo.com/v1/forecast", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          latitude: 0,
          longitude: 0,
          current_weather: {
            temperature: 25,
            windspeed: 5,
            winddirection: 0,
            weathercode: 0,
            is_day: 1,
            time: "2026-08-13T12:00",
          },
        });
      })
    );

    await fetchWeather(0, 0);

    const url = new URL(capturedUrl);
    expect(url.searchParams.get("current_weather")).toBe("true");
  });
});

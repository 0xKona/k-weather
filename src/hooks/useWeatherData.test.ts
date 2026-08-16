import { renderHook, waitFor } from "@testing-library/react";
import { beforeAll, afterAll, afterEach, describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/__tests__/mocks/server";
import { useWeatherData } from "./useWeatherData";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("useWeatherData", () => {
  describe("initial state", () => {
    it("returns null weather and not loading when no coordinates provided", () => {
      const { result } = renderHook(() => useWeatherData(null, null));

      expect(result.current.weather).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("fetching weather", () => {
    it("fetches weather when coordinates are provided", async () => {
      const { result } = renderHook(() => useWeatherData(51.5085, -0.1257));

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.weather).not.toBeNull();
      expect(result.current.weather?.current_weather.temperature).toBe(18.5);
      expect(result.current.weather?.latitude).toBe(51.5085);
    });

    it("re-fetches when coordinates change", async () => {
      const { result, rerender } = renderHook(
        ({ lat, lng }) => useWeatherData(lat, lng),
        { initialProps: { lat: 51.5085 as number | null, lng: -0.1257 as number | null } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.weather?.latitude).toBe(51.5085);

      // Change coordinates
      rerender({ lat: 48.8566, lng: 2.3522 });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.weather?.latitude).toBe(48.8566);
    });

    it("does not fetch when coordinates are null", () => {
      const { result } = renderHook(() => useWeatherData(null, null));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.weather).toBeNull();
    });

    it("clears weather and stops loading when coordinates become null", async () => {
      const { result, rerender } = renderHook(
        ({ lat, lng }) => useWeatherData(lat, lng),
        { initialProps: { lat: 51.5085 as number | null, lng: -0.1257 as number | null } }
      );

      await waitFor(() => {
        expect(result.current.weather).not.toBeNull();
      });

      rerender({ lat: null, lng: null });

      expect(result.current.weather).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("error handling", () => {
    it("sets error when fetch fails", async () => {
      server.use(
        http.get("https://api.open-meteo.com/v1/forecast", () =>
          HttpResponse.json(
            { error: true, reason: "Server error" },
            { status: 500 }
          )
        )
      );

      const { result } = renderHook(() => useWeatherData(51.5085, -0.1257));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.weather).toBeNull();
      expect(result.current.error).toBe("Failed to fetch weather data");
    });

    it("clears error on successful subsequent fetch", async () => {
      // First: force error
      server.use(
        http.get("https://api.open-meteo.com/v1/forecast", () =>
          HttpResponse.json({}, { status: 500 })
        )
      );

      const { result, rerender } = renderHook(
        ({ lat, lng }) => useWeatherData(lat, lng),
        { initialProps: { lat: 51.5085 as number | null, lng: -0.1257 as number | null } }
      );

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Reset to success handler
      server.resetHandlers();

      // Change coordinates to trigger re-fetch
      rerender({ lat: 48.8566, lng: 2.3522 });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(result.current.weather).not.toBeNull();
    });
  });

  describe("race condition handling", () => {
    it("ignores stale responses when coordinates change quickly", async () => {
      let requestCount = 0;

      server.use(
        http.get("https://api.open-meteo.com/v1/forecast", async ({ request }) => {
          requestCount++;
          const url = new URL(request.url);
          const lat = parseFloat(url.searchParams.get("latitude") ?? "0");

          // First request is slow
          if (requestCount === 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          return HttpResponse.json({
            latitude: lat,
            longitude: 0,
            current_weather: {
              temperature: lat === 51.5085 ? 10 : 25,
              windspeed: 5,
              winddirection: 180,
              weathercode: 0,
              is_day: 1,
              time: "2026-08-13T10:00",
            },
          });
        })
      );

      const { result, rerender } = renderHook(
        ({ lat, lng }) => useWeatherData(lat, lng),
        { initialProps: { lat: 51.5085 as number | null, lng: -0.1257 as number | null } }
      );

      // Quickly change to Paris before London response arrives
      rerender({ lat: 48.8566, lng: 2.3522 });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have Paris data, not stale London data
      expect(result.current.weather?.latitude).toBe(48.8566);
    });
  });
});

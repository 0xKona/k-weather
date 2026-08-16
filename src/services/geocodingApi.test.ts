import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { server } from "@/__tests__/mocks/server";
import { http, HttpResponse } from "msw";
import { searchLocations } from "./geocodingApi";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("searchLocations", () => {
  it("returns matching locations for a valid query", async () => {
    const results = await searchLocations("London");

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      id: 2643743,
      name: "London",
      latitude: 51.5085,
      longitude: -0.1257,
      country: "United Kingdom",
      timezone: "Europe/London",
    });
  });

  it("returns an empty array when no results match", async () => {
    server.use(
      http.get("https://geocoding-api.open-meteo.com/v1/search", () => {
        return HttpResponse.json({ results: [] });
      })
    );

    const results = await searchLocations("xyznonexistent");
    expect(results).toEqual([]);
  });

  it("returns an empty array when API returns no results key", async () => {
    server.use(
      http.get("https://geocoding-api.open-meteo.com/v1/search", () => {
        return HttpResponse.json({});
      })
    );

    const results = await searchLocations("nowhere");
    expect(results).toEqual([]);
  });

  it("returns an empty array for empty query string", async () => {
    const results = await searchLocations("");
    expect(results).toEqual([]);
  });

  it("returns an empty array for whitespace-only query", async () => {
    const results = await searchLocations("   ");
    expect(results).toEqual([]);
  });

  it("returns an empty array when the network request fails", async () => {
    server.use(
      http.get("https://geocoding-api.open-meteo.com/v1/search", () => {
        return HttpResponse.error();
      })
    );

    const results = await searchLocations("London");
    expect(results).toEqual([]);
  });

  it("passes the query as the name parameter", async () => {
    let capturedUrl = "";

    server.use(
      http.get("https://geocoding-api.open-meteo.com/v1/search", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ results: [] });
      })
    );

    await searchLocations("Tokyo");

    const url = new URL(capturedUrl);
    expect(url.searchParams.get("name")).toBe("Tokyo");
  });

  it("limits results to 5 by default", async () => {
    let capturedUrl = "";

    server.use(
      http.get("https://geocoding-api.open-meteo.com/v1/search", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ results: [] });
      })
    );

    await searchLocations("Paris");

    const url = new URL(capturedUrl);
    expect(url.searchParams.get("count")).toBe("5");
  });
});

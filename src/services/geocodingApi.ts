import type { GeocodingResult, GeocodingResponse } from "@/types";

const GEOCODING_BASE_URL = "https://geocoding-api.open-meteo.com/v1/search";

// Fetch location suggestions from Open-Meteo geocoding API
export async function searchLocations(
  query: string,
  count: number = 5
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      name: trimmed,
      count: String(count),
      language: "en",
      format: "json",
    });

    const response = await fetch(`${GEOCODING_BASE_URL}?${params}`);

    if (!response.ok) {
      return [];
    }

    const data: GeocodingResponse = await response.json();

    return data.results ?? [];
  } catch {
    return [];
  }
}

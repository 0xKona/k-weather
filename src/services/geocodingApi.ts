import type { GeocodingResult, GeocodingResponse } from "@/types";

const GEOCODING_BASE_URL = "https://geocoding-api.open-meteo.com/v1/search";

// BigDataCloud free reverse geocoding — no API key required
const REVERSE_GEOCODING_BASE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

// ─── Default location ─────────────────────────────────────────────────────────

// Used as the fallback when no URL params or geolocation are available
export const LONDON_DEFAULT: GeocodingResult = {
  id: 2643743,
  name: "London",
  latitude: 51.50853,
  longitude: -0.12574,
  country: "United Kingdom",
  country_code: "GB",
  timezone: "Europe/London",
  admin1: "England",
};

// ─── Forward geocoding ────────────────────────────────────────────────────────

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

// ─── Reverse geocoding ────────────────────────────────────────────────────────

interface BigDataCloudResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
  countryCode?: string;
  // Timezone comes from a nested object
  localityInfo?: {
    administrative?: Array<{ name: string; adminLevel: number }>;
  };
}

// Strips formal UN-style suffixes that some reverse geocoding APIs append.
// e.g. "United States of America (the)" → "United States of America"
function cleanCountryName(name: string): string {
  return name.replace(/\s*\(the\)\s*$/i, "").trim();
}
// Falls back to null if the request fails or returns insufficient data.
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      localityLanguage: "en",
    });

    const response = await fetch(`${REVERSE_GEOCODING_BASE_URL}?${params}`);

    if (!response.ok) return null;

    const data: BigDataCloudResponse = await response.json();

    // Prefer city name, fall back to locality
    const name = data.city || data.locality;
    if (!name || !data.countryName || !data.countryCode) return null;

    const timezone = await fetchTimezoneForCoords(latitude, longitude);

    return {
      id: Math.round(latitude * 1000) * 1000000 + Math.round(longitude * 1000),
      name,
      latitude,
      longitude,
      country: cleanCountryName(data.countryName),
      country_code: data.countryCode,
      timezone: timezone ?? "UTC",
      admin1: data.principalSubdivision,
    };
  } catch {
    return null;
  }
}

// Fetch the IANA timezone string for a coordinate pair using Open-Meteo's
// forecast API — it returns timezone as part of the response metadata.
async function fetchTimezoneForCoords(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      timezone: "auto",
      forecast_days: "0",
    });

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.timezone ?? null;
  } catch {
    return null;
  }
}

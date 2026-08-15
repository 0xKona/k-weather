"use client";

import { useState, useEffect } from "react";
import { reverseGeocode, LONDON_DEFAULT } from "@/services/geocodingApi";
import type { GeocodingResult } from "@/types";

// How long to wait for geolocation before falling back to London (ms)
const GEOLOCATION_TIMEOUT_MS = 8000;

// ─── URL param helpers ────────────────────────────────────────────────────────

// Read lat/lng from the current URL search params.
// Returns null if params are missing or invalid.
function readCoordsFromUrl(): { latitude: number; longitude: number } | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const lat = parseFloat(params.get("lat") ?? "");
  const lng = parseFloat(params.get("lng") ?? "");

  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { latitude: lat, longitude: lng };
}

// ─── Geolocation helper ───────────────────────────────────────────────────────

// Request the browser's current position as a Promise.
// Rejects if denied, unavailable, or times out.
function requestGeolocation(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err),
      { timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: 60_000 }
    );
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseInitialLocationReturn {
  // The resolved initial location — null while resolving
  initialLocation: GeocodingResult | null;
  // Whether we're still resolving (URL geocode or geolocation in progress)
  isResolving: boolean;
}

// Determines the initial location on first load using the following priority:
//   1. URL params (?lat=x&lng=y) — restored via reverse geocoding
//   2. Browser geolocation — if the user grants permission
//   3. London — fallback default
//
// Returns the resolved location and a resolving flag for loading states.
export function useInitialLocation(): UseInitialLocationReturn {
  const [initialLocation, setInitialLocation] = useState<GeocodingResult | null>(null);
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      // ── Step 1: Check URL params ──────────────────────────────────────────
      const urlCoords = readCoordsFromUrl();

      if (urlCoords) {
        const result = await reverseGeocode(urlCoords.latitude, urlCoords.longitude);
        if (!cancelled) {
          // Use reverse geocoded result, or fall back to a minimal location
          // using the raw coords if reverse geocoding fails
          setInitialLocation(result ?? {
            ...LONDON_DEFAULT,
            latitude: urlCoords.latitude,
            longitude: urlCoords.longitude,
          });
          setIsResolving(false);
        }
        return;
      }

      // ── Step 2: Request geolocation ───────────────────────────────────────
      try {
        const coords = await requestGeolocation();
        const result = await reverseGeocode(coords.latitude, coords.longitude);
        if (!cancelled) {
          setInitialLocation(result ?? LONDON_DEFAULT);
          setIsResolving(false);
        }
      } catch {
        // ── Step 3: Fall back to London ───────────────────────────────────
        if (!cancelled) {
          setInitialLocation(LONDON_DEFAULT);
          setIsResolving(false);
        }
      }
    }

    resolve();

    return () => { cancelled = true; };
  }, []);

  return { initialLocation, isResolving };
}

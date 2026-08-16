"use client";

import { useEffect } from "react";
import type { GeocodingResult } from "@/types";

// ─── URL param helpers ────────────────────────────────────────────────────────

// Writes the selected location into the URL as ?lat=x&lng=y using
// replaceState so it doesn't pollute browser history with every selection.
function writeLocationToUrl(location: GeocodingResult): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  params.set("lat", location.latitude.toFixed(5));
  params.set("lng", location.longitude.toFixed(5));

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", newUrl);
}

// Removes lat/lng params from the URL when no location is selected.
function clearLocationFromUrl(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  params.delete("lat");
  params.delete("lng");

  const search = params.toString();
  const newUrl = search
    ? `${window.location.pathname}?${search}`
    : window.location.pathname;

  window.history.replaceState(null, "", newUrl);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

// Keeps the URL in sync with the selected location.
// Writes ?lat=x&lng=y whenever location changes, clears params when null.
// Uses replaceState — no new history entries are created.
export function useUrlLocation(location: GeocodingResult | null): void {
  useEffect(() => {
    if (location) {
      writeLocationToUrl(location);
    } else {
      clearLocationFromUrl();
    }
  }, [location]);
}

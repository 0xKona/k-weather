"use client";

import { useState, useEffect, useCallback } from "react";
import {
  WIND_SPEED_UNIT_STORAGE_KEY,
  type WindSpeedUnit,
} from "@/lib/speed";

interface UseWindSpeedUnitReturn {
  unit: WindSpeedUnit;
  toggleUnit: () => void;
}

// Reads/writes the user's wind speed unit preference in localStorage.
// Defaults to km/h on the server and the first client render (so SSR and
// hydration match), then applies any saved preference after mount.
export function useWindSpeedUnit(): UseWindSpeedUnitReturn {
  const [unit, setUnit] = useState<WindSpeedUnit>("kph");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(WIND_SPEED_UNIT_STORAGE_KEY);
      if (stored === "kph" || stored === "mph") {
        setUnit(stored);
      }
    } catch {
      // localStorage unavailable (privacy mode, blocked storage) — keep default
    }
  }, []);

  const toggleUnit = useCallback(() => {
    setUnit((prev) => {
      const next: WindSpeedUnit = prev === "kph" ? "mph" : "kph";
      try {
        window.localStorage.setItem(WIND_SPEED_UNIT_STORAGE_KEY, next);
      } catch {
        // Persisting failed — the in-memory toggle still applies
      }
      return next;
    });
  }, []);

  return { unit, toggleUnit };
}

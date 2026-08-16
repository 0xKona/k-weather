"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TEMPERATURE_UNIT_STORAGE_KEY,
  type TemperatureUnit,
} from "@/lib/temperature";

interface UseTemperatureUnitReturn {
  unit: TemperatureUnit;
  toggleUnit: () => void;
}

// Reads/writes the user's temperature unit preference in localStorage.
// Defaults to celsius on the server and the first client render (so SSR and
// hydration match), then applies any saved preference after mount.
export function useTemperatureUnit(): UseTemperatureUnitReturn {
  const [unit, setUnit] = useState<TemperatureUnit>("celsius");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(TEMPERATURE_UNIT_STORAGE_KEY);
      if (stored === "celsius" || stored === "fahrenheit") {
        setUnit(stored);
      }
    } catch {
      // localStorage unavailable (privacy mode, blocked storage) — keep default
    }
  }, []);

  const toggleUnit = useCallback(() => {
    setUnit((prev) => {
      const next: TemperatureUnit = prev === "celsius" ? "fahrenheit" : "celsius";
      try {
        window.localStorage.setItem(TEMPERATURE_UNIT_STORAGE_KEY, next);
      } catch {
        // Persisting failed — the in-memory toggle still applies
      }
      return next;
    });
  }, []);

  return { unit, toggleUnit };
}

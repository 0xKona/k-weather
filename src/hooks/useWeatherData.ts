"use client";

import { useState, useEffect, useRef } from "react";
import { fetchWeather } from "@/services/weatherApi";
import type { WeatherResponse } from "@/types";

interface UseWeatherDataReturn {
  weather: WeatherResponse | null;
  isLoading: boolean;
  error: string | null;
}

// Fetches weather data for given coordinates, re-fetching when they change
export function useWeatherData(
  latitude: number | null,
  longitude: number | null
): UseWeatherDataReturn {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the latest request to handle race conditions
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (latitude === null || longitude === null) {
      setWeather(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    fetchWeather(latitude, longitude).then((data) => {
      // Ignore stale responses
      if (currentRequestId !== requestIdRef.current) return;

      if (data) {
        setWeather(data);
        setError(null);
      } else {
        setWeather(null);
        setError("Failed to fetch weather data");
      }

      setIsLoading(false);
    });
  }, [latitude, longitude]);

  return { weather, isLoading, error };
}

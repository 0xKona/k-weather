"use client";

import { useState, useRef, useCallback } from "react";
import { searchLocations } from "@/services/geocodingApi";
import type { GeocodingResult } from "@/types";

interface UseGeocodingReturn {
  query: string;
  setQuery: (query: string) => void;
  results: GeocodingResult[];
  isLoading: boolean;
  error: string | null;
  clearResults: () => void;
}

const DEBOUNCE_MS = 300;

// Manages geocoding search state with debounced API calls
export function useGeocoding(): UseGeocodingReturn {
  const [query, setQueryState] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);

    // Cancel pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const trimmed = newQuery.trim();

    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchLocations(trimmed);
        setResults(data);
        setError(null);
      } catch {
        setResults([]);
        setError("Failed to search locations");
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setIsLoading(false);
    setError(null);
  }, []);

  return { query, setQuery, results, isLoading, error, clearResults };
}

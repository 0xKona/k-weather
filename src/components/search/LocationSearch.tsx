"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import { Search, ArrowUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { glassPanel } from "@/lib/glass";
import { searchLocations } from "@/services/geocodingApi";
import { LocationSuggestions } from "./LocationSuggestions";
import type { GeocodingResult } from "@/types";

interface LocationSearchProps {
  onLocationSelect: (location: GeocodingResult) => void;
  // Day/night at the selected location — adapts the glass tint over the globe
  isDay?: boolean;
}

export function LocationSearch({ onLocationSelect, isDay = true }: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const listboxId = "location-suggestions";

  const performSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const results = await searchLocations(trimmed);
    setSuggestions(results);
    setIsOpen(results.length > 0);
    setIsLoading(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      setActiveIndex(-1);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (!value.trim()) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      debounceRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    },
    [performSearch]
  );

  const handleSelect = useCallback(
    (result: GeocodingResult) => {
      setQuery(result.name);
      setSuggestions([]);
      setIsOpen(false);
      setActiveIndex(-1);
      onLocationSelect(result);
    },
    [onLocationSelect]
  );

  // Submit: select active suggestion, or first suggestion if none active
  const handleSubmit = useCallback(() => {
    if (activeIndex >= 0 && activeIndex < suggestions.length) {
      handleSelect(suggestions[activeIndex]);
    } else if (suggestions.length > 0) {
      handleSelect(suggestions[0]);
    }
  }, [activeIndex, suggestions, handleSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
        return;
      }

      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setActiveIndex(-1);
          break;
      }
    },
    [isOpen, suggestions, handleSubmit]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const activeDescendant =
    activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : "";

  return (
    <div className="relative w-full max-w-md">
      {(isOpen || isLoading) && (
        <LocationSuggestions
          suggestions={suggestions}
          isLoading={isLoading}
          activeIndex={activeIndex}
          onSelect={handleSelect}
          listboxId={listboxId}
          isDay={isDay}
        />
      )}
      <div className="relative flex items-center">
        <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeDescendant}
          placeholder="Search for a location..."
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={cn(
            "pl-10 pr-12 py-3 h-11 rounded-xl focus-visible:ring-accent/60 focus-visible:border-accent/60",
            glassPanel(isDay)
          )}
        />
        <Button
          type="button"
          variant="default"
          size="icon-sm"
          onClick={handleSubmit}
          disabled={suggestions.length === 0}
          aria-label="Submit search"
          className="absolute right-1.5 rounded-xl"
        >
          <ArrowUp className="size-4" />
        </Button>
      </div>
    </div>
  );
}

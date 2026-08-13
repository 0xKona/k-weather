"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import type { GeocodingResult } from "@/types";

interface LocationSuggestionsProps {
  suggestions: GeocodingResult[];
  isLoading: boolean;
  activeIndex: number;
  onSelect: (result: GeocodingResult) => void;
  listboxId: string;
}

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0 },
};

export function LocationSuggestions({
  suggestions,
  isLoading,
  activeIndex,
  onSelect,
  listboxId,
}: LocationSuggestionsProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!isLoading && suggestions.length === 0) {
    return null;
  }

  return (
    <motion.ul
      role="listbox"
      id={listboxId}
      className="absolute bottom-full left-0 right-0 mb-2 backdrop-blur-md bg-popover/90 border border-border rounded-lg overflow-hidden z-50"
      variants={shouldReduceMotion ? undefined : listVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <AnimatePresence>
        {isLoading ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <li
                key={`skeleton-${i}`}
                data-testid="skeleton-item"
                className="px-4 py-3 space-y-1.5"
              >
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </li>
            ))}
          </>
        ) : (
          suggestions.map((result, index) => (
            <motion.li
              key={result.id}
              role="option"
              id={`${listboxId}-option-${index}`}
              aria-selected={index === activeIndex}
              variants={shouldReduceMotion ? undefined : itemVariants}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                index === activeIndex
                  ? "bg-accent/20 text-accent-foreground"
                  : "hover:bg-accent/10"
              }`}
              onClick={() => onSelect(result)}
            >
              <div className="font-medium text-foreground">{result.name}</div>
              <div className="text-sm text-muted-foreground">
                {result.admin1
                  ? `${result.admin1}, ${result.country}`
                  : result.country}
              </div>
            </motion.li>
          ))
        )}
      </AnimatePresence>
    </motion.ul>
  );
}

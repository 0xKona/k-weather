"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Wind } from "lucide-react";
import type { WeatherResponse } from "@/types";
import { WeatherIcon } from "./WeatherIcon";

interface WeatherCardProps {
  weather: WeatherResponse | null;
  isLoading: boolean;
}

// Maps WMO weather codes to human-readable condition text
function getConditionText(code: number): string {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code === 66 || code === 67) return "Freezing rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code === 85 || code === 86) return "Snow showers";
  if (code === 95 || code === 96 || code === 99) return "Thunderstorm";
  return "Unknown";
}

function WeatherCardSkeleton() {
  return (
    <div
      data-testid="weather-card-skeleton"
      className="backdrop-blur-lg bg-card/80 border border-border/10 rounded-xl p-6 w-64"
    >
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-8 rounded-full bg-white/10" data-testid="skeleton-icon" />
        <div className="h-12 w-32 rounded-lg bg-white/10" data-testid="skeleton-temp" />
        <div className="h-4 w-24 rounded bg-white/10" data-testid="skeleton-condition" />
        <div className="h-4 w-20 rounded bg-white/10" data-testid="skeleton-wind" />
      </div>
    </div>
  );
}

export function WeatherCard({ weather, isLoading }: WeatherCardProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!weather && !isLoading) {
    return null;
  }

  const animationProps = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration: 0.3, ease: "easeOut" },
      };

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div key="skeleton" {...animationProps}>
          <WeatherCardSkeleton />
        </motion.div>
      ) : weather ? (
        <motion.div
          key="weather-data"
          role="region"
          aria-label="Current weather"
          aria-live="polite"
          className="backdrop-blur-lg bg-card/80 border border-border/10 rounded-xl p-6 w-64"
          {...animationProps}
        >
          <div className="flex items-start gap-3">
            <WeatherIcon
              weatherCode={weather.current_weather.weathercode}
              isDay={weather.current_weather.is_day === 1}
            />
            <div className="flex flex-col">
              <span className="text-5xl font-bold text-white">
                {weather.current_weather.temperature}°C
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                {getConditionText(weather.current_weather.weathercode)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <Wind className="size-4" aria-hidden="true" />
            <span>{weather.current_weather.windspeed} km/h</span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Wind, Sunrise, Sunset } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { glassPanel } from "@/lib/glass";
import { formatTemperature, otherUnit, unitLabel, type TemperatureUnit } from "@/lib/temperature";
import type { WeatherResponse } from "@/types";
import { WeatherIcon } from "./WeatherIcon";

interface WeatherCardProps {
  weather: WeatherResponse | null;
  isLoading: boolean;
  animationDelay?: number;
  unit?: TemperatureUnit;
  onToggleUnit?: () => void;
}

// Extract the local "HH:MM" from an ISO local time string e.g. "2026-08-13T05:47"
function formatTime(localIso: string): string {
  return localIso.slice(11, 16);
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
    <Card className={cn("w-full max-w-md", glassPanel(true))} data-testid="weather-card-skeleton">
      <CardContent className="space-y-4">
        <Skeleton className="size-8 rounded-full" data-testid="skeleton-icon" />
        <Skeleton className="h-12 w-32" data-testid="skeleton-temp" />
        <Skeleton className="h-4 w-24" data-testid="skeleton-condition" />
        <Skeleton className="h-4 w-20" data-testid="skeleton-wind" />
      </CardContent>
    </Card>
  );
}

export function WeatherCard({
  weather,
  isLoading,
  animationDelay = 0,
  unit = "celsius",
  onToggleUnit,
}: WeatherCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const isDay = weather?.current_weather.is_day === 1;

  if (!weather && !isLoading) {
    return null;
  }

  const animationProps = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration: 0.3, ease: "easeOut" as const, delay: animationDelay },
      };

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div key="skeleton" className="w-full max-w-md" {...animationProps}>
          <WeatherCardSkeleton />
        </motion.div>
      ) : weather ? (
        <motion.div
          key="weather-data"
          className="w-full max-w-md"
          role="region"
          aria-label="Current weather"
          aria-live="polite"
          {...animationProps}
        >
          <Card className={cn("w-full max-w-md", glassPanel(isDay))}>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <WeatherIcon
                    weatherCode={weather.current_weather.weathercode}
                    isDay={isDay}
                    className="size-10"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">
                      {getConditionText(weather.current_weather.weathercode)}
                    </span>
                    <button
                      type="button"
                      onClick={onToggleUnit}
                      title={`Switch to ${unitLabel(otherUnit(unit))}`}
                      aria-label={`Switch to ${unitLabel(otherUnit(unit))}`}
                      className="text-5xl font-bold text-foreground leading-tight cursor-pointer transition-opacity hover:opacity-75"
                    >
                      {formatTemperature(weather.current_weather.temperature, unit)}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wind className="size-4" aria-hidden="true" />
                  <span>{weather.current_weather.windspeed} km/h</span>
                </div>
              </div>

              {weather.daily?.sunrise?.[0] && weather.daily?.sunset?.[0] && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Sunrise className="size-4" aria-hidden="true" />
                    {formatTime(weather.daily.sunrise[0])}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sunset className="size-4" aria-hidden="true" />
                    {formatTime(weather.daily.sunset[0])}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

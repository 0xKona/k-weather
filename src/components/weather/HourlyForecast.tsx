"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { glassPanel } from "@/lib/glass";
import type { WeatherResponse } from "@/types";
import { WeatherIcon } from "./WeatherIcon";

interface HourlyForecastProps {
  weather: WeatherResponse | null;
  isLoading: boolean;
  animationDelay?: number;
}

const STRIP_ID = "hourly-forecast-strip";

// Extract the local "HH:MM" from an ISO local time string e.g. "2026-08-13T10:00"
function formatHour(localIso: string): string {
  return localIso.slice(11, 16);
}

function HourlyStripSkeleton() {
  return (
    <div className="flex gap-3" data-testid="hourly-strip-skeleton">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex min-w-14 flex-col items-center gap-2">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
    </div>
  );
}

export function HourlyForecast({ weather, isLoading, animationDelay = 0 }: HourlyForecastProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isExpanded, setIsExpanded] = useState(false);
  const isDay = weather?.current_weather.is_day === 1;

  if (!weather && !isLoading) {
    return null;
  }

  // Nothing to show once loaded if the API omitted hourly data
  if (weather && !weather.hourly) {
    return null;
  }

  const hours = weather?.hourly ?? null;
  // "YYYY-MM-DDTHH" of the current observation — used to label the first
  // hourly entry "Now" when it falls within the current hour
  const currentHourIso = weather?.current_weather.time.slice(0, 13);

  const animationProps = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: "easeOut" as const, delay: animationDelay },
      };

  const toggle = () => setIsExpanded((prev) => !prev);

  return (
    <motion.div
      className="w-full max-w-md"
      role="region"
      aria-label="Hourly forecast"
      aria-live="polite"
      {...animationProps}
    >
      <Card className={cn("w-full max-w-md", glassPanel(isDay))}>
        <CardContent>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={isExpanded}
            aria-controls={STRIP_ID}
            className="flex w-full items-center justify-between rounded-lg text-left"
          >
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Hourly forecast
            </span>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform duration-300",
                isExpanded && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>

          {isExpanded && (
            <div
              id={STRIP_ID}
              className="mt-3 flex gap-2 overflow-x-auto pb-1 snap-x [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent"
              data-testid="hourly-scroll-container"
            >
              {isLoading || !hours ? (
                <HourlyStripSkeleton />
              ) : (
                hours.time.map((time, index) => (
                  <div
                    key={time}
                    className="flex min-w-14 snap-start flex-col items-center gap-1"
                    data-testid="hour-item"
                  >
                    <span className="text-xs text-muted-foreground">
                      {index === 0 && time.slice(0, 13) === currentHourIso
                        ? "Now"
                        : formatHour(time)}
                    </span>
                    <WeatherIcon
                      weatherCode={hours.weathercode[index]}
                      isDay={hours.is_day[index] === 1}
                      className="size-6"
                    />
                    <span className="text-sm font-medium tabular-nums">
                      {hours.temperature_2m[index]}°
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

"use client";

import { useState, useEffect } from "react";

function getLocalHour(timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    return parseInt(formatter.format(new Date()), 10);
  } catch {
    return 12; // fallback to midday
  }
}

// Returns the current local hour (0–23) in the given timezone.
// Re-evaluates every minute. Returns null when no timezone is provided.
export function useLocalHour(timezone: string | null | undefined): number | null {
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    if (!timezone) {
      setHour(null);
      return;
    }

    setHour(getLocalHour(timezone));

    const interval = setInterval(() => {
      setHour(getLocalHour(timezone));
    }, 60_000);

    return () => clearInterval(interval);
  }, [timezone]);

  return hour;
}

// Convenience — true if local hour is night (20:00–06:00)
export function useIsNight(timezone: string | null | undefined): boolean {
  const hour = useLocalHour(timezone);
  if (hour === null) return false;
  return hour >= 20 || hour < 6;
}

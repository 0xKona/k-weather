"use client";

import type { LucideIcon } from "lucide-react";
import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudHail,
  Snowflake,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WeatherIconProps {
  weatherCode: number;
  isDay: boolean;
  className?: string;
}

// Maps WMO weather codes to lucide-react icons
function getWeatherIcon(code: number, isDay: boolean): LucideIcon {
  if (code === 0) {
    return isDay ? Sun : Moon;
  }

  if (code >= 1 && code <= 3) {
    return isDay ? CloudSun : CloudMoon;
  }

  if (code === 45 || code === 48) {
    return CloudFog;
  }

  if (code >= 51 && code <= 55) {
    return CloudDrizzle;
  }

  if (code >= 61 && code <= 65) {
    return CloudRain;
  }

  if (code === 66 || code === 67) {
    return CloudHail;
  }

  if (code >= 71 && code <= 77) {
    return Snowflake;
  }

  if (code >= 80 && code <= 82) {
    return CloudRain;
  }

  if (code === 85 || code === 86) {
    return CloudSnow;
  }

  if (code === 95 || code === 96 || code === 99) {
    return CloudLightning;
  }

  return Cloud;
}

export function WeatherIcon({ weatherCode, isDay, className }: WeatherIconProps) {
  const Icon = getWeatherIcon(weatherCode, isDay);

  return <Icon className={cn("size-8", className)} aria-hidden="true" />;
}

"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { WeatherResponse } from "@/types";
import { latLngToUnitVector } from "@/lib/coordinates";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEG_TO_RAD = Math.PI / 180;

// ─── Solar calculations ───────────────────────────────────────────────────────

// Calculate the approximate solar declination for a given date.
// Declination is the angle between the sun and the equatorial plane, which
// varies between -23.45° (December solstice) and +23.45° (June solstice).
function getSolarDeclination(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (date.getTime() - startOfYear.getTime()) / 86_400_000
  );
  // Approximate formula (accurate to ~1°)
  return 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * DEG_TO_RAD);
}

// Equation of time in minutes — the difference between apparent and mean solar
// time. Correcting for it places the subsolar point (and thus sunrise/sunset)
// to within ~1 minute of the true value.
function getEquationOfTime(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (date.getTime() - startOfYear.getTime()) / 86_400_000
  );
  const b = (2 * Math.PI * (dayOfYear - 81)) / 364;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

// Reconstruct the UTC instant from the weather API's local time + offset.
// Open-Meteo returns local time without a timezone suffix, so we parse the
// components directly and subtract the offset — this is correct regardless of
// the browser's own timezone (Date's string parsing would apply the browser
// timezone, which only matches by coincidence).
function getUtcDate(weather: WeatherResponse): Date | null {
  const time = weather.current_weather?.time;
  if (!time) return null;
  const utcMs = parseLocalTime(time, weather.utc_offset_seconds ?? 0);
  return utcMs == null ? null : new Date(utcMs);
}

// Parse a local "YYYY-MM-DDTHH:MM" string (no timezone suffix) into a UTC
// instant, treating it as local time at the location using its UTC offset.
function parseLocalTime(localIso: string, utcOffsetSeconds: number): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(localIso);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match;
  const utcMs = Date.UTC(+y, +mo - 1, +d, +h, +mi) - utcOffsetSeconds * 1000;
  return Number.isNaN(utcMs) ? null : utcMs;
}

// ─── Sun direction ────────────────────────────────────────────────────────────
//
// The sun is a single direction in space at any instant, determined only by
// UTC and the date — never by the selected location. We compute the subsolar
// point (the location where the sun is directly overhead) and return the
// direction to it in the globe's Earth-fixed local frame — the same frame used
// by latLngToUnitVector (north pole = +Y, prime meridian at equator = +X).
//
// Because this direction is expressed in the globe's own local frame, it stays
// correct regardless of how the globe is rotated to show the selected location:
//   - the day/night terminator is computed per-fragment in the shader as
//     dot(surfaceNormal, sunDirection) > 0 → day, < 0 → night
//   - the directional light sits inside the rotating globe group and therefore
//     always shines from the correct direction
//
// Solar geometry:
//   - Subsolar latitude = solar declination (seasonal, ±23.45°).
//   - Subsolar longitude = the meridian where local apparent solar time = 12:00:
//       longitude = (12 - UTC hours) * 15°  (corrected by the equation of time)
//     At 17:51 UTC in mid-August the subsolar point is ~14.5°N, 86°W — i.e. the
//     central US, with Europe on the day side and east Asia in night. Correct.

function computeSunDirection(utcDate: Date): THREE.Vector3 {
  const utcHours =
    utcDate.getUTCHours() +
    utcDate.getUTCMinutes() / 60 +
    utcDate.getUTCSeconds() / 3600;
  const equationOfTime = getEquationOfTime(utcDate); // minutes

  const subsolarLat = getSolarDeclination(utcDate);
  const subsolarLng = (12 - utcHours) * 15 - equationOfTime / 4;

  const [x, y, z] = latLngToUnitVector(subsolarLat, subsolarLng);
  return new THREE.Vector3(x, y, z).normalize();
}

// ─── Day/night at the selected location ──────────────────────────────────────
//
// Prefer the fetched daily sunrise/sunset window (accurate to the minute from
// Open-Meteo). Fall back to the sun's computed elevation above the horizon.

function isDayAtLocation(
  weather: WeatherResponse | null,
  utcMs: number,
  sunDirection: THREE.Vector3,
  latitude: number | null,
  longitude: number | null
): boolean {
  const daily = weather?.daily;
  if (weather && daily?.sunrise?.length && daily?.sunset?.length) {
    const utcOffsetSeconds = weather.utc_offset_seconds ?? 0;
    const sunriseMs = parseLocalTime(daily.sunrise[0], utcOffsetSeconds);
    const sunsetMs = parseLocalTime(daily.sunset[0], utcOffsetSeconds);
    // sunriseMs/sunsetMs are the UTC instants of today's sunrise/sunset at the
    // location, so compare against the current UTC instant directly
    if (sunriseMs != null && sunsetMs != null) {
      return utcMs >= sunriseMs && utcMs < sunsetMs;
    }
  }

  if (latitude == null || longitude == null) return true;
  const [lx, ly, lz] = latLngToUnitVector(latitude, longitude);
  return sunDirection.dot(new THREE.Vector3(lx, ly, lz)) > 0;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface SunPosition {
  // Unit direction to the sun in the globe's Earth-fixed local frame
  position: THREE.Vector3;
  // True when the sun is above the horizon at the selected location
  isDay: boolean;
  // 0–1 intensity multiplier — full at midday, dim at dusk/dawn, near-zero at night
  intensity: number;
}

// Derives a globally-correct sun direction and per-location brightness from
// Open-Meteo weather data. The sun direction depends only on the UTC instant
// (weather timestamp, falling back to the device clock); the intensity depends
// on the sun's elevation at the selected location.
export function useSunPosition(
  weather: WeatherResponse | null,
  latitude: number | null,
  longitude: number | null
): SunPosition {
  return useMemo(() => {
    const utcDate = weather ? getUtcDate(weather) : null;
    const utcMs = (utcDate ?? new Date()).getTime();
    const sunDirection = computeSunDirection(utcDate ?? new Date());

    if (latitude == null || longitude == null) {
      return { position: sunDirection, isDay: true, intensity: 1.0 };
    }

    const isDay = isDayAtLocation(weather, utcMs, sunDirection, latitude, longitude);

    // Sun elevation at the selected location — sin(elevation) is the dot
    // product of the location's unit vector with the sun direction
    const [lx, ly, lz] = latLngToUnitVector(latitude, longitude);
    const sinAlt = Math.max(
      -1,
      Math.min(1, sunDirection.dot(new THREE.Vector3(lx, ly, lz)))
    );

    // Intensity: full at midday (elevation ~90°), reduced at low sun angles,
    // very dim at night (city lights on night texture carry the visual weight)
    const intensity = isDay
      ? 1.0 + Math.max(0, sinAlt) * 2.5  // 1.0 at horizon → 3.5 at zenith
      : 0.15;                             // dim backlight at night

    return { position: sunDirection, isDay, intensity };
  }, [weather, latitude, longitude]);
}

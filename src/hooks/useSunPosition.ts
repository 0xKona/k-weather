"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { WeatherResponse } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEG_TO_RAD = Math.PI / 180;

// Distance of the directional light from the origin — large enough that it
// acts as a parallel (sun-like) light source across the whole globe
const SUN_DISTANCE = 400;

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

// Convert weather API data into a 3D sun position in world space.
//
// Coordinate system (matches Three.js scene):
//   +Y = north pole / up
//   +Z = toward camera (prime meridian faces camera after globe rotation)
//   +X = east becomes west after globe's viewing rotation
//
// The globe is always rotated so the selected location faces +Z toward the
// camera. This means:
//   - Solar noon  → sun is in front of globe (+Z) and above (+Y)
//   - 6am (east)  → sun rises from -X side (east maps to -X in world space
//                    because the globe faces us — east is to our left)
//   - 6pm (west)  → sun sets toward +X
//   - Midnight    → sun is behind globe (-Z)
//
// The observer latitude affects the sun's maximum elevation angle (altitude)
// at solar noon via: altitude = 90° - |latitude - declination|
function computeSunPosition(
  localTimeIso: string,      // e.g. "2026-08-15T14:30"
  utcOffsetSeconds: number,  // e.g. 3600 for BST
  observerLat: number,       // location latitude in degrees
  isDay: boolean
): THREE.Vector3 {
  // ── Parse local time ──────────────────────────────────────────────────────
  // The API returns local time without a timezone suffix — reconstruct UTC
  // by subtracting the offset, then use that for declination calculation
  const localMs = new Date(localTimeIso).getTime();
  const utcDate = new Date(localMs - utcOffsetSeconds * 1000);

  const localHour =
    (new Date(localTimeIso).getHours()) +
    (new Date(localTimeIso).getMinutes()) / 60;

  // ── Hour angle ────────────────────────────────────────────────────────────
  // The hour angle is 0 at solar noon, negative in the morning, positive in
  // the afternoon. Each hour = 15° of Earth rotation.
  // We use local solar time ≈ clock time here (ignores equation of time,
  // accurate to within ~15 minutes which is sufficient for lighting).
  const hourAngle = (localHour - 12) * 15 * DEG_TO_RAD;

  // ── Solar declination ─────────────────────────────────────────────────────
  const declination = getSolarDeclination(utcDate) * DEG_TO_RAD;
  const latRad = observerLat * DEG_TO_RAD;

  // ── Solar altitude angle ──────────────────────────────────────────────────
  // How high above the horizon the sun is at this moment.
  // sin(altitude) = sin(lat)·sin(dec) + cos(lat)·cos(dec)·cos(hourAngle)
  const sinAlt =
    Math.sin(latRad) * Math.sin(declination) +
    Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngle);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

  // ── Solar azimuth angle ───────────────────────────────────────────────────
  // Direction of the sun around the horizon (0 = south, clockwise).
  // cos(azimuth) = (sin(dec) - sin(alt)·sin(lat)) / (cos(alt)·cos(lat))
  const cosAlt = Math.cos(altitude);
  const cosAz =
    cosAlt > 0.0001
      ? (Math.sin(declination) - sinAlt * Math.sin(latRad)) /
        (cosAlt * Math.cos(latRad))
      : 0;
  const azimuthFromSouth = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  // Flip azimuth in the afternoon (hour angle > 0 means sun is west of south)
  const azimuth = hourAngle > 0 ? azimuthFromSouth : -azimuthFromSouth;

  // ── Convert to world-space Cartesian ─────────────────────────────────────
  // In geographic space (before globe rotation):
  //   North = +Y, East = +X (geographic), Up-from-surface = +Z (toward camera
  //   after the globe rotates the location to face +Z)
  //
  // After latLngToQuaternion the location faces +Z. Geographic east therefore
  // maps to -X in world space (east is to our left when facing the globe).
  // Azimuth from south, clockwise: south=-Z, east=+X(geo)=-X(world), north=+Z, west=+X(world)
  const x = -Math.sin(azimuth) * Math.cos(altitude); // east → -X world
  const y =  Math.sin(altitude);                      // up   → +Y world
  const z =  Math.cos(azimuth) * Math.cos(altitude);  // south→ -Z, north→ +Z

  const position = new THREE.Vector3(x, y, z).normalize().multiplyScalar(SUN_DISTANCE);

  // When is_day=0 the sun is below the horizon — position it behind the globe
  // at low intensity (handled by caller) so shadows remain consistent
  if (!isDay) {
    position.negate();
  }

  return position;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface SunPosition {
  // 3D position of the directional light in world space
  position: THREE.Vector3;
  // True when the sun is above the horizon at the selected location
  isDay: boolean;
  // 0–1 intensity multiplier — full at midday, dim at dusk/dawn, near-zero at night
  intensity: number;
}

// Derives a realistic sun position and intensity from Open-Meteo weather data.
// Returns a stable default (midday sun) when weather data is not yet available.
export function useSunPosition(
  weather: WeatherResponse | null,
  latitude: number | null
): SunPosition {
  return useMemo(() => {
    // Default: midday sun from slightly west, full intensity
    const defaultPosition = new THREE.Vector3(-8, 5, 8).normalize().multiplyScalar(SUN_DISTANCE);

    if (!weather?.current_weather || latitude == null) {
      return { position: defaultPosition, isDay: true, intensity: 3.0 };
    }

    const { current_weather, utc_offset_seconds = 0 } = weather;
    const isDay = current_weather.is_day === 1;

    const position = computeSunPosition(
      current_weather.time,
      utc_offset_seconds,
      latitude,
      isDay
    );

    // Intensity: full at midday (altitude ~90°), reduced at low sun angles,
    // very dim at night (city lights on night texture carry the visual weight)
    const altitudeFraction = Math.max(0, position.y / SUN_DISTANCE);
    const intensity = isDay
      ? 1.0 + altitudeFraction * 2.5  // 1.0 at horizon → 3.5 at zenith
      : 0.15;                          // dim backlight at night

    return { position, isDay, intensity };
  }, [weather, latitude]);
}

import type { SphericalCoordinates } from "@/types";

const DEG_TO_RAD = Math.PI / 180;

// Convert latitude/longitude to spherical coordinates for Three.js globe rotation
export function latLngToSpherical(lat: number, lng: number): SphericalCoordinates {
  // phi: polar angle from north pole (0 = north pole, PI = south pole)
  const phi = Math.PI / 2 - lat * DEG_TO_RAD;
  // theta: azimuthal angle from prime meridian
  const theta = lng * DEG_TO_RAD;

  return { phi, theta };
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// Calculate approximate sun direction vector for day/night terminator
export function calculateSunDirection(date: Date): Vec3 {
  const dayOfYear = getDayOfYear(date);
  const hourUTC = date.getUTCHours() + date.getUTCMinutes() / 60;

  // Solar declination (approximate, varies ±23.44° over the year)
  const declination = -23.44 * Math.cos((360 / 365) * (dayOfYear + 10) * DEG_TO_RAD) * DEG_TO_RAD;

  // Hour angle: sun is at lng=0 at noon UTC, rotates 15°/hour
  const hourAngle = (hourUTC - 12) * 15 * DEG_TO_RAD;

  // Convert to cartesian unit vector (sun direction in world space)
  const x = Math.cos(declination) * Math.cos(hourAngle);
  const y = Math.sin(declination);
  const z = Math.cos(declination) * Math.sin(hourAngle);

  return { x, y, z };
}

// Get UTC offset in hours for a timezone string
export function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });

    const parts = formatter.formatToParts(now);
    const tzPart = parts.find((p) => p.type === "timeZoneName");

    if (!tzPart) return 0;

    // Format is "GMT+9", "GMT-5", "GMT" etc.
    const match = tzPart.value.match(/GMT([+-]\d+)?/);

    if (!match) return 0;
    if (!match[1]) return 0;

    return parseInt(match[1], 10);
  } catch {
    return 0;
  }
}

// Calculate the day of the year (1-365)
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

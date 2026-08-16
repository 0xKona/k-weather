export type WindSpeedUnit = "kph" | "mph";

// localStorage key for the user's wind speed unit preference
export const WIND_SPEED_UNIT_STORAGE_KEY = "kweather.windspeed-unit";

// Converts a speed in km/h to mph using the exact international mile
// (1 mile = 1.609344 km).
export function kphToMph(kph: number): number {
  return kph / 1.609344;
}

// Formats a km/h wind speed for display in the chosen unit.
// km/h is shown as-is (matching the API's precision, e.g. "12.3 km/h");
// mph is rounded to a whole number, the common weather-app convention
// (e.g. "8 mph").
export function formatWindSpeed(kph: number, unit: WindSpeedUnit): string {
  if (unit === "mph") {
    return `${Math.round(kphToMph(kph))} mph`;
  }
  return `${kph} km/h`;
}

// Returns the other unit (used for the toggle button's accessible label)
export function otherSpeedUnit(unit: WindSpeedUnit): WindSpeedUnit {
  return unit === "kph" ? "mph" : "kph";
}

// Human-readable unit name, e.g. for the toggle button's accessible label
export function speedUnitLabel(unit: WindSpeedUnit): string {
  return unit === "kph" ? "Kilometers per hour" : "Miles per hour";
}

export type TemperatureUnit = "celsius" | "fahrenheit";

// localStorage key for the user's temperature unit preference
export const TEMPERATURE_UNIT_STORAGE_KEY = "kweather.temperature-unit";

// Converts a Celsius temperature to Fahrenheit.
// F = C * 9/5 + 32
export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

// Formats a Celsius temperature value for display in the chosen unit.
// Celsius is shown as-is (matching the API's precision, e.g. "18.5°C");
// Fahrenheit is rounded to a whole degree, the common weather-app convention
// (e.g. "65°F").
export function formatTemperature(celsius: number, unit: TemperatureUnit): string {
  if (unit === "fahrenheit") {
    return `${Math.round(celsiusToFahrenheit(celsius))}°F`;
  }
  return `${celsius}°C`;
}

// Returns the other unit (used for the toggle button's accessible label)
export function otherUnit(unit: TemperatureUnit): TemperatureUnit {
  return unit === "celsius" ? "fahrenheit" : "celsius";
}

// Human-readable unit name, e.g. for the toggle button's accessible label
export function unitLabel(unit: TemperatureUnit): string {
  return unit === "celsius" ? "Celsius" : "Fahrenheit";
}

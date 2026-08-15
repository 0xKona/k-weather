import type { WeatherResponse } from "@/types";

const WEATHER_BASE_URL = "https://api.open-meteo.com/v1/forecast";

// Fetch current weather data from Open-Meteo for given coordinates
export async function fetchWeather(
  latitude: number,
  longitude: number
): Promise<WeatherResponse | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current_weather: "true",
      // Sunrise/sunset for the selected location — displayed in the UI and
      // used to validate day/night state
      daily: "sunrise,sunset",
      // Hourly conditions for the horizontal 12-hour forecast strip
      hourly: "temperature_2m,weathercode,is_day",
      // Limit the hourly forecast to the next 12 hours
      forecast_hours: "12",
      // Request timezone metadata so we can derive utc_offset_seconds for sun positioning
      timezone: "auto",
    });

    const response = await fetch(`${WEATHER_BASE_URL}?${params}`);

    if (!response.ok) {
      return null;
    }

    const data: WeatherResponse = await response.json();

    return data;
  } catch {
    return null;
  }
}

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

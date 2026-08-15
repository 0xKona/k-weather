export interface CurrentWeather {
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  // 1 = day, 0 = night — more accurate than hour-based calculation as it
  // accounts for actual sunrise/sunset at the given latitude
  is_day: number;
  // ISO 8601 local time at the location e.g. "2026-08-15T12:30"
  time: string;
}

// Daily values from Open-Meteo. Times are ISO local time at the location,
// one entry per forecast day, e.g. ["2026-08-13T05:47"].
export interface DailyWeather {
  time: string[];
  sunrise: string[];
  sunset: string[];
}

// Hourly forecast values from Open-Meteo. Times are ISO local time at the
// location, one entry per hour. is_day: 1 = day, 0 = night.
export interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  weathercode: number[];
  is_day: number[];
}

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  current_weather: CurrentWeather;
  daily?: DailyWeather;
  hourly?: HourlyWeather;
  // IANA timezone string e.g. "Europe/London"
  timezone?: string;
  timezone_abbreviation?: string;
  // Seconds offset from UTC e.g. 3600 for BST — used to derive solar hour angle
  utc_offset_seconds?: number;
}

export interface WeatherError {
  error: boolean;
  reason: string;
}

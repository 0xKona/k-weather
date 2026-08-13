export interface CurrentWeather {
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  is_day: number;
  time: string;
}

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  current_weather: CurrentWeather;
  timezone?: string;
  timezone_abbreviation?: string;
}

export interface WeatherError {
  error: boolean;
  reason: string;
}

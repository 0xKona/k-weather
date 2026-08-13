export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  timezone: string;
  admin1?: string;
  country_code?: string;
}

export interface GeocodingResponse {
  results?: GeocodingResult[];
}

export interface Location {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

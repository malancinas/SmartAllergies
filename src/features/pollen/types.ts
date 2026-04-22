export type PollenLevel = 'none' | 'low' | 'medium' | 'high' | 'very_high';

export interface PollenTypeData {
  level: PollenLevel;
  /** Raw grains/m³ value (summed for tree and weed categories) */
  rawValue: number;
}

export interface DailyPollenForecast {
  date: string; // YYYY-MM-DD
  tree: PollenTypeData;
  grass: PollenTypeData;
  weed: PollenTypeData;
  /** Overall worst level across all types */
  overallLevel: PollenLevel;
}

export interface HourlyPollenPoint {
  time: string; // ISO8601
  tree: number;
  grass: number;
  weed: number;
}

export interface PollenForecastResponse {
  hourly: HourlyPollenPoint[];
  daily: DailyPollenForecast[];
  /** True if all values were zero — likely outside coverage area */
  limitedCoverage: boolean;
}

export interface WeatherPoint {
  time: string; // ISO8601
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitationProbability: number;
  weatherCode: number;
}

export interface WeatherForecastResponse {
  hourly: WeatherPoint[];
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

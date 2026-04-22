export type PollenLevel = 'none' | 'low' | 'medium' | 'high' | 'very_high';

export type PollenConfidence = 'high' | 'medium' | 'low';

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

export interface SourceMetadata {
  name: string;
  lastUpdated: string; // ISO8601
  /** 'local' = data from this area, 'regional' = nearest data is distant */
  coverage: 'local' | 'regional';
}

export interface MergedDailyPollenForecast extends DailyPollenForecast {
  confidence: PollenConfidence;
  sourceMetadata: SourceMetadata[];
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

export type Status =
  "Unknown" | "Light Green" | "Dark Green" | "Amber" | "Red" | "No Paddling";

export interface KayakConditions {
  riverLevel?: number;
  levelChange?: {
    value: number;
    period: string; // e.g., '8h'
  };
  launchMessage?: string;
  initialStatus?: Status;
  temperature?: number;
  apparentTemperature?: number;
  windSpeed?: number;
  windGust?: number;
  gustStatus?: Status;
  windDirection?: number;
  rain?: boolean;
  rainWhileWarm?: boolean;
  dark?: boolean;
  visibility?: number;
  visibilityDescription?: string;
  weatherCode?: number;
  weatherDescription?: string;
  overallStatus: Status;
  reasons?: string[];
  warnings?: WeatherWarning[];
  lastUpdated?: string;
}

export type WarningSeverity = "Yellow" | "Amber" | "Red";

export interface WeatherWarning {
  severity: WarningSeverity;
  type: string; // e.g., "Extreme Heat", "Wind", "Rain"
  headline: string;
  description: string;
  link: string;
  validFrom: string;
  validTo: string;
  validFromISO?: string;
  validToISO?: string;
}

// From RiverLevelGraph.tsx
export interface RiverReading {
  dateTime: string;
  value: number;
}

export interface ApiResponse {
  items: RiverReading[];
}

export interface ChartDataPoint {
  dateTime: string; // ISO string
  level: number;
}

export interface WeatherData {
  temperature: number;
  // Best_match's "feels like", from its own wind - not the highest-model
  // wind shown beside it.
  apparentTemperature?: number;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  rain: boolean;
  visibility: number;
  weatherCode: number;
}

export interface HourlyData {
  time: string[];
  temperature_2m: number[];
  precipitation: number[];
  visibility: number[];
  wind_speed_10m: number[];
  wind_gusts_10m: number[];
  weather_code: number[];
}

export interface DailyData {
  sunrise: string[];
  sunset: string[];
}

export interface FutureWeatherData {
  hourly: HourlyData;
  daily: DailyData;
}

export interface RiverDataResult {
  latestLevel: number | null;
  change1h: number | null;
  change24h: number | null;
  change8h: number | null;
  change5d: number | null;
  historicalData: ChartDataPoint[];
}

// Bewdley forecast/observation points as they travel over JSON - timestamp is
// an ISO string on the wire, revived to a Date on the client before use.
export interface BewdleyForecastPointDTO {
  timestamp: string;
  level: number;
}

export interface BewdleyData {
  forecasts: BewdleyForecastPointDTO[];
  observations: BewdleyForecastPointDTO[];
  currentLevel: number | null;
}

// Combined payload served by /api/conditions. Each source is fetched and
// cached independently server-side, so any one of them can be null if its
// upstream API failed - the client falls back to its own last-known cache
// for just that source.
export interface ConditionsApiResponse {
  river: RiverDataResult | null;
  weather: WeatherData | null;
  futureWeather: FutureWeatherData | null;
  bewdley: BewdleyData;
  warnings: WeatherWarning[];
  fetchedAt: string;
}

// "held" means no forecast covers the hour: the level is the last linear
// estimate carried forward unchanged.
export type ForecastSource = "bewdley" | "linear" | "held";

export interface ForecastGraphDataPoint {
  time: string;
  status: Status;
  reasons: string[];
  value: number;
  forecastLevel: number;
  forecastSource: ForecastSource;
  temperature?: number;
  windSpeed?: number;
  windGust?: number;
  gustStatus?: Status;
  rainWhileWarm?: boolean;
  weatherDescription?: string;
}

export interface DayForecast {
  date: string; // "YYYY-MM-DD"
  label: string; // "Today", "Mon", etc. - the five days never repeat a name
  graphData: ForecastGraphDataPoint[];
  sunrise: string | null;
  sunset: string | null;
}

export type PaddlerType =
  "Beginner" | "Improver" | "Intermediate" | "Independent";

export type PaddlingStatusValue = "Yes" | "No" | "Discretion" | "Warning";

export interface PaddlingStatus {
  status: PaddlingStatusValue;
  details: string[];
}

export type PaddlingMatrix = {
  [key in PaddlerType]?: PaddlingStatus;
};

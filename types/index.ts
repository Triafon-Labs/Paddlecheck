export type Status =
  | "Unknown"
  | "Light Green"
  | "Dark Green"
  | "Amber"
  | "Red"
  | "No Paddling";

export interface KayakConditions {
  riverLevel?: number;
  levelChange?: {
    value: number;
    period: string; // e.g., '8h'
  };
  launchMessage?: string;
  launchStatus?: string;
  initialStatus?: Status;
  temperature?: number;
  windSpeed?: number;
  windDirection?: number;
  rain?: boolean;
  dark?: boolean;
  visibility?: number;
  visibilityDescription?: string;
  weatherCode?: number;
  weatherDescription?: string;
  pitchcroftPaddleability?: string;
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
  windSpeed: number;
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

export interface PredictedGraphDataPoint {
  time: string;
  status: Status;
  reasons: string[];
  value: number;
  predictedLevel: number;
  predictionSource: "bewdley" | "linear";
  temperature?: number;
  windSpeed?: number;
}

export interface DayForecast {
  date: string; // "YYYY-MM-DD"
  label: string; // "Today", "Mon 1", etc.
  graphData: PredictedGraphDataPoint[];
  sunrise: string | null;
  sunset: string | null;
}

export type PaddlerType =
  | "Beginner"
  | "Improver"
  | "Intermediate"
  | "Independent";

export type PaddlingStatusValue = "Yes" | "No" | "Discretion" | "Warning";

export interface PaddlingStatus {
  status: PaddlingStatusValue;
  details: string;
}

export type PaddlingMatrix = {
  [key in PaddlerType]?: PaddlingStatus;
};

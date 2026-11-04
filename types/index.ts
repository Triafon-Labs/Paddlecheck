import type { ElementType } from "react";
// A status step's name from club.yaml (steps), or "Unknown".
export type Status = string;

// One step of the status scale (STATUS_STEPS in lib/config.ts).
export interface StatusStep {
  name: string;
  fromLevel: number;
  color: string;
  onColor: string;
  emoji: string;
  icon: ElementType;
  description: string;
  riverDescription: string;
  riverReason?: string;
  reasonIcon?: ElementType;
  bestTimes?: boolean;
}

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

// Upstream forecast/observation points as they travel over JSON - timestamp is
// an ISO string on the wire, revived to a Date on the client before use.
export interface UpstreamForecastPointDTO {
  timestamp: string;
  level: number;
}

export interface UpstreamData {
  forecasts: UpstreamForecastPointDTO[];
  observations: UpstreamForecastPointDTO[];
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
  upstream: UpstreamData;
  warnings: WeatherWarning[];
  fetchedAt: string;
}

// "held" means no forecast covers the hour: the level is the last linear
// estimate carried forward unchanged.
export type ForecastSource = "upstream" | "linear" | "held";

export interface ForecastGraphDataPoint {
  time: string;
  status: Status;
  reasons: string[];
  value: number;
  forecastLevel: number;
  forecastSource: ForecastSource;
  // Whether the hour counts as dark (isDarkHour), whether or not darkness
  // raises its status (RULES.DARKNESS). Missing from forecasts cached by
  // older versions, which only had the "Dark" reason to go on.
  dark?: boolean;
  temperature?: number;
  windSpeed?: number;
  windGust?: number;
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

// A paddler level from club.yaml (paddlerLevels).
export type PaddlerType = string;

export type PaddlingStatusValue = "Yes" | "No" | "Discretion" | "Warning";

// One cell of the Who Can Paddle table (WHO_CAN_PADDLE in lib/config.ts).
export interface PaddlingVerdict {
  verdict: PaddlingStatusValue;
  details?: string[];
}

// A rule applied on top of the table (WHO_CAN_PADDLE_EXTRAS).
export interface PaddlingExtraRule {
  // When it applies. Every condition given must hold; none means always.
  when?: {
    status?: Status[];
    notStatus?: Status[];
    riverLevelAtLeast?: number;
  };
  levels: PaddlerType[];
  // Replace the verdict outright - the only change made to a "No".
  set?: PaddlingVerdict;
  // Turn a "Yes" into this, e.g. "Warning".
  yesBecomes?: PaddlingStatusValue;
  // Add this line, or put it in place of `replacing` if that line is there.
  addDetail?: string;
  replacing?: string;
}

export interface PaddlingStatus {
  status: PaddlingStatusValue;
  details: string[];
}

export type PaddlingMatrix = Record<PaddlerType, PaddlingStatus>;

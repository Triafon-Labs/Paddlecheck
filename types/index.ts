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
  rain?: boolean;
  dark?: boolean;
  visibility?: number;
  overallStatus: Status;
  statusReason?: string;
  lastUpdated?: string;
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
  time: string;
  level: number;
}

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  rain: boolean;
  dark: boolean;
  visibility: number;
}

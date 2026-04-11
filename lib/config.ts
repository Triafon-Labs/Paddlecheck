import {
  HelpOutline,
  Check,
  WarningAmberOutlined,
  DoNotDisturbOutlined,
  TrendingUpOutlined,
  Thermostat,
  CrisisAlert,
  Air,
  WaterDrop,
  NightsStay,
  Thunderstorm,
  Flood,
  Water,
  Waves,
  Tsunami,
  AcUnit,
  Foggy,
} from "@mui/icons-material";
import { Status } from "@/types";

// ============================================================================
// CONFIGURATION
// ============================================================================
// This file contains all the configuration for the Paddlecheck application.
// It is currently set up for Worcester Canoe Club (UK) on the River Severn.
// If you are forking this repo for another club, you will need to update
// the values below to match your location and river conditions.
// ============================================================================

// --- Club Information & Links ---
// Links displayed in the "Useful Links" popover
export const USEFUL_LINKS = [
  {
    name: "River Severn level at Worcester (Barbourne)",
    url: "https://check-for-flooding.service.gov.uk/station/2092",
  },
  {
    name: "River Severn level at Bewdley",
    url: "https://check-for-flooding.service.gov.uk/station/2001",
  },
  {
    name: "Worcester Canoe Club",
    url: "https://worcestercanoeclub.org/",
  },
];

// --- River and Weather Service ---
// Station ID for the Environment Agency Flood Monitoring API
export const RIVER_STATION_ID = "2642"; // Diglis
export const LATITUDE = 52.2;
export const LONGITUDE = -2.2;
export const HISTORICAL_DAYS = 5;

// Bewdley upstream station forecast (used to improve Worcester predictions)
// The flood wave takes ~6 hours to travel from Bewdley to Worcester
export const BEWDLEY_CSV_URL =
  "https://check-for-flooding.service.gov.uk/station-csv/2001";
export const BEWDLEY_TRAVEL_HOURS = 6;

export const API_ENDPOINTS = {
  RIVER: `https://environment.data.gov.uk/flood-monitoring/id/stations`,
  WEATHER: `https://api.open-meteo.com/v1/forecast`,
};

// --- RAG Status Definitions ---
export const RAG_STATUS_MAP: Record<number, Status> = {
  0: "Light Green",
  1: "Dark Green",
  2: "Amber",
  3: "Red",
};

export const RAG_HEIGHT_MAP: Record<Status, number> = {
  "Light Green": 1.0,
  "Dark Green": 0.75,
  Amber: 0.5,
  Red: 0.25,
  "No Paddling": 0.1,
  Unknown: 0.1,
};

export const RAG_STATUS_UI: Record<
  Status,
  {
    color: string;
    emoji: string;
    icon: React.ElementType;
    backgroundColor: string;
  }
> = {
  Unknown: {
    color: "#9E9E9E",
    emoji: "🤷",
    icon: HelpOutline,
    backgroundColor: "#F5F5F5",
  },
  "Light Green": {
    color: "#4CBB17",
    emoji: "✅",
    icon: Check,
    backgroundColor: "#E8F5E9",
  },
  "Dark Green": {
    color: "#008000",
    emoji: "📈",
    icon: TrendingUpOutlined,
    backgroundColor: "#C8E6C9",
  },
  Amber: {
    color: "#FFBF00",
    emoji: "⚠️",
    icon: WarningAmberOutlined,
    backgroundColor: "#FFF3E0",
  },
  Red: {
    color: "#FF0000",
    emoji: "🚨",
    icon: CrisisAlert,
    backgroundColor: "#FFEBEE",
  },
  "No Paddling": {
    color: "#FF0000",
    emoji: "⛔",
    icon: DoNotDisturbOutlined,
    backgroundColor: "#E0E0E0",
  },
};

// --- RAG Calculation Criteria ---
// Adjust these thresholds based on your local safety guidelines
export const CRITERIA_TABLE: {
  [key: string]: { [key: string]: number[] };
} = {
  high: { calm: [0, 1, 2, 3], windy: [1, 2, 3, 3] },
  moderate: { calm: [1, 2, 2, 3], windy: [2, 2, 2, 3], rainy: [2, 2, 2, 3] },
  low: { calm: [2, 2, 3, 3], windy: [2, 3, 3, 3], rainy: [2, 2, 3, 3] },
};

export const THRESHOLDS = {
  TEMP_HIGH: 13,
  TEMP_MODERATE: 5,
  WIND_HIGH: 15,
  VISIBILITY_POOR: 1000,
  RIVER_LEVEL_NO_PADDLING: 5.0,
  THUNDERSTORM_CODES: [95, 96, 97, 98, 99],
  FOG_CODES: [40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
  RIVER_LEVEL_INITIAL_RAG_1: 1.0,
  RIVER_LEVEL_INITIAL_RAG_2: 1.4,
  RIVER_LEVEL_INITIAL_RAG_3: 2.2,
};

// --- UI Text and Icons ---
export const REASON_ICONS: Record<string, React.ElementType> = {
  [`Slightly elevated river level (> ${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_1}m)`]:
    Water,
  [`Moderately elevated river level (> ${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_2}m)`]:
    Waves,
  [`Significantly elevated river level (> ${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_3}m)`]:
    Tsunami,
  "Moderately low temperature": Thermostat,
  "Low temperature": AcUnit,
  "High winds": Air,
  Rain: WaterDrop,
  Dark: NightsStay,
  Foggy: Foggy,
  "River level is dangerously high": Flood,
  "Risk of thunderstorms": Thunderstorm,
};

// Descriptions of river levels at specific local landmarks.
// The key is the river level in meters.
export const LEVEL_DESCRIPTIONS: Record<number, string> = {
  1.0: "Able to launch from the landing stage – OK",
  1.15: "Water over one end of the landing stage",
  1.38: "10cm over landing stage, able to launch OK",
  1.48: "On concrete lower deck – wet feet!",
  1.52: "+5cm concrete lower deck, not deep enough – still wet feet!",
  1.68: "+10cm concrete lower deck, deep enough for boat to float – dry feet!",
  2.0: "Bollards submerged, launch with care",
  2.12: "Half way up steps – have to portage around the lock at Diglis",
  2.75: "10th step wet, wet feet possible",
  4.28: "Almost on the car park – dry feet!",
  4.37: "5cm on the car park – not deep enough for boats, wet feet!",
  4.49: "Water on car park, safe to park only if falling. Variable paddling on Pitchcroft",
  4.7: "Just in the boat house! Plenty of water on Pitchcroft - paddle with care",
  5.01: "Boathouse flooding. Water can flow back into the river from Pitchcroft, creating stronger flows - paddle with extreme care",
  5.02: "Deep water in boathouse, boats can float out. Water can flow back into the river from Pitchcroft, creating stronger flows - paddle with extreme care",
  5.18: "Grand Stand Road flooded, unsafe to access boathouse",
  5.54: "Sabrina Bridge closed, North Parade underwater, dangerous flows",
  5.55: "Boathouse inaccessible, dangerous flow, no paddling advised",
};

// Specific to Pitchcroft race course paddleability
export const PITCHCROFT_PADDLEABILITY: Record<number, string> = {
  4.0: "Variable",
  4.5: "Good",
  5.0: "Risky",
};

export const getPitchcroftPaddleability = (
  level: number
): string | undefined => {
  const allLevels = Object.keys(PITCHCROFT_PADDLEABILITY)
    .map(parseFloat)
    .sort((a, b) => b - a); // Sort descending

  const applicableLevel = allLevels.find((key) => level >= key);

  return applicableLevel
    ? PITCHCROFT_PADDLEABILITY[applicableLevel]
    : undefined;
};

export const VISIBILITY_DESCRIPTIONS: {
  [key: string]: { min: number; desc: string };
} = {
  EXCELLENT: { min: 10000, desc: "Excellent" },
  GOOD: { min: 5000, desc: "Good" },
  MODERATE: { min: 2000, desc: "Moderate" },
  POOR: { min: 1000, desc: "Poor" },
  VERY_POOR: { min: 0, desc: "Very Poor" },
};

// --- Time-based Constants ---
export const TIME_PERIODS = {
  ONE_HOUR: 1 * 60 * 60 * 1000,
  EIGHT_HOURS: 8 * 60 * 60 * 1000,
  TWENTY_FOUR_HOURS: 24 * 60 * 60 * 1000,
};

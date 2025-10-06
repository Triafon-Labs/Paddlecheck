import { KayakConditions, Status } from "@/types";
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
  WbCloudy,
} from "@mui/icons-material";

// --- Constants and Type Definitions ---

export const RAG_STATUS_MAP: Record<number, Status> = {
  0: "Light Green",
  1: "Dark Green",
  2: "Amber",
  3: "Red",
};

const CRITERIA_TABLE: {
  [key: string]: { [key: string]: number[] };
} = {
  high: { calm: [0, 1, 2, 3], windy: [1, 2, 3, 3] },
  moderate: { calm: [1, 2, 2, 3], windy: [2, 2, 2, 3], rainy: [2, 2, 2, 3] },
  low: { calm: [2, 2, 3, 3], windy: [2, 3, 3, 3], rainy: [2, 2, 3, 3] },
};

// --- UI-related Data ---

export const levelDescriptions: Record<number, string> = {
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
  4.49: "Water on car park, safe to park only if falling. Variable paddling on Pitchcroft.",
  4.7: "Just in the boat house!!",
  5.01: "Boathouse flooding. Pitchcroft paddleable but shallow, watch for posts.",
  5.02: "Deep water in boathouse, boats can float out. Pitchcroft paddleable but shallow, watch for posts.",
  5.18: "Grand Stand Road flooded, unsafe to access boathouse.",
  5.54: "Sabrina Bridge closed, North Parade underwater, dangerous flows.",
  5.55: "Boathouse inaccessible, dangerous flow, no paddling advised.",
};

export const ragStatus: Record<
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

export const reasonIcons: Record<string, React.ElementType> = {
  "Slightly elevated river level": TrendingUpOutlined,
  "Moderately elevated river level": TrendingUpOutlined,
  "Significantly elevated river level": CrisisAlert,
  "Moderately low temperature": Thermostat,
  "Low temperature": Thermostat,
  "High winds": Air,
  Rain: WaterDrop,
  Dark: NightsStay,
  Foggy: WbCloudy,
};

export const ragHeight: Record<Status, number> = {
  "Light Green": 1.0,
  "Dark Green": 0.75,
  Amber: 0.5,
  Red: 0.25,
  "No Paddling": 0.1,
  Unknown: 0.1,
};

// --- Helper Functions for RAG Calculation ---

export const findLevelDescription = (level: number): string => {
  const allLevels = Object.keys(levelDescriptions)
    .map(parseFloat)
    .sort((a, b) => a - b);
  const nextLevelUp = allLevels.find((key) => key > level);
  if (!nextLevelUp) return levelDescriptions[allLevels[0]];
  const gap = nextLevelUp - level;
  const description = levelDescriptions[nextLevelUp];
  return gap > 0.1
    ? `${description} (applies at ${nextLevelUp.toFixed(2)}m)`
    : description;
};

export const calculateInitialRagStatus = (level: number): number => {
  if (level < 1.0) return 0;
  if (level < 1.4) return 1;
  if (level < 2.2) return 2;
  return 3;
};

const getTemperatureConditions = (
  temp: number
): { tempCondition: string; reason?: string } => {
  if (temp >= 13) return { tempCondition: "high" };
  if (temp >= 5)
    return {
      tempCondition: "moderate",
      reason: "Moderately low temperature",
    };
  return { tempCondition: "low", reason: "Low temperature" };
};

const getWeatherConditions = (
  wind: number,
  isRainy: boolean,
  tempCondition: string
): { weatherCondition: string; reason?: string } => {
  if (wind >= 15) return { weatherCondition: "windy", reason: "High winds" };
  if (tempCondition !== "high" && isRainy)
    return { weatherCondition: "rainy", reason: "Rain" };
  return { weatherCondition: "calm" };
};

const adjustRagForFactors = (
  baseRag: number,
  isDark: boolean,
  visibility: number,
  weatherCode: number
): { ragNumber: number; reasons: string[] } => {
  let ragNumber = baseRag;
  const reasons: string[] = [];
  if (isDark) {
    reasons.push("Dark");
    ragNumber += 1;
  }
  const isFoggy = visibility < 1000 || [45, 48].includes(weatherCode);
  if (isFoggy) {
    reasons.push("Foggy");
    ragNumber += 1;
  }
  return { ragNumber: Math.min(ragNumber, 3), reasons };
};

const getRiverLevelReason = (initialRag: number): string | undefined => {
  if (initialRag === 1) return "Slightly elevated river level";
  if (initialRag === 2) return "Moderately elevated river level";
  if (initialRag === 3) return "Significantly elevated river level";
  return undefined;
};

// --- Main RAG Calculation Function ---

export const calculateFinalRagStatus = (
  conditions: Partial<KayakConditions>
): { status: Status; reasons: string[] } => {
  const {
    riverLevel,
    temperature,
    windSpeed,
    rain,
    dark,
    visibility,
    weatherCode,
  } = conditions;

  if (
    [
      riverLevel,
      temperature,
      windSpeed,
      rain,
      dark,
      visibility,
      weatherCode,
    ].some((v) => v === undefined)
  ) {
    return { status: "Unknown", reasons: ["Missing data"] };
  }

  if (riverLevel! >= 5.0) {
    return {
      status: "No Paddling",
      reasons: ["River level is dangerously high"],
    };
  }
  if ([95, 96, 99].includes(weatherCode!)) {
    return { status: "No Paddling", reasons: ["Risk of thunderstorms"] };
  }

  const initialRag = calculateInitialRagStatus(riverLevel!);
  const { tempCondition, reason: tempReason } = getTemperatureConditions(
    temperature!
  );
  const { weatherCondition, reason: weatherReason } = getWeatherConditions(
    windSpeed!,
    rain!,
    tempCondition
  );

  const finalRag = CRITERIA_TABLE[tempCondition]?.[weatherCondition]?.[initialRag];
  if (finalRag === undefined) {
    return {
      status: "Unknown",
      reasons: ["Could not determine conditions"],
    };
  }

  const { ragNumber, reasons: adjustmentReasons } = adjustRagForFactors(
    finalRag,
    dark!,
    visibility!,
    weatherCode!
  );

  const allReasons = [
    getRiverLevelReason(initialRag),
    tempReason,
    weatherReason,
    ...adjustmentReasons,
  ].filter(Boolean) as string[];

  return {
    status: RAG_STATUS_MAP[ragNumber] || "Unknown",
    reasons: allReasons,
  };
};
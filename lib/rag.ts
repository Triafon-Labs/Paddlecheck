import { KayakConditions, Status } from "@/types";
import {
  HelpOutline,
  CheckCircleOutline,
  WarningAmberOutlined,
  DoNotDisturbOutlined,
  Flood,
  TrendingUpOutlined,
  Thermostat,
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
    1.38: "10 cm over the landing stage; able to launch OK",
    1.48: "On the concrete lower deck – wet feet!",
    1.52: "5 cm over the concrete lower deck; not deep enough – wet feet!",
    1.55: "Boat well below the concrete for easy access; water shallow nearby – wet feet",
    1.68: "10 cm over the concrete lower deck; boat floats – dry feet",
    2.0: "Bollards submerged; launch with care to avoid collisions",
    2.12: "Halfway up steps; caution with rudders. Portage around the lock at Diglis",
    2.75: "10th step level with water; concrete terrace slightly wet – wet feet possible",
    4.28: "Almost on the car park – dry feet! Pitchcroft unlikely paddleable; monitor levels closely",
    4.3: "Pitchcroft still unlikely paddleable; monitor levels closely",
    4.37: "5 cm on the car park; not deep enough for boats – wet feet. Pitchcroft still unlikely paddleable",
    4.4: "Water coming onto the WCC car park; Pitchcroft paddleable near the boathouse; avoid the far side",
    4.49: "Water on the car park; safe to park only if falling. Variable paddling conditions on Pitchcroft depending on water flow",
    4.62: "Plenty of water on Pitchcroft for paddling",
    4.7: "Water just in the boathouse – Pitchcroft paddleable",
    5.01: "Boathouse flooding. Pitchcroft paddleable, but shallow on the far side; watch for underwater posts",
    5.02: "Deep water in the boathouse; boats can float out to the car park. Pitchcroft paddleable, but shallow on the far side; watch for underwater posts",
    5.18: "Grand Stand Road flooded; unsafe to access the boathouse; water flowing back over the road adds risks",
    5.54: "Sabrina Bridge closed; North Parade underwater; dangerous flows",
    5.55: "Boathouse inaccessible; dangerous flow – paddling not advised",
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
    icon: CheckCircleOutline,
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
    icon: Flood,
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
  "Significantly elevated river level": Flood,
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
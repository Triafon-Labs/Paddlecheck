import { KayakConditions, Status } from "@/types";
import {
  HelpOutline,
  CheckCircleOutline,
  WarningAmberOutlined,
  DoNotDisturbOutlined,
  Flood,
  TrendingUpOutlined,
} from "@mui/icons-material";

// --- Existing exports that are still needed ---

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

export const ragHeight: Record<Status, number> = {
  "Light Green": 1.0,
  "Dark Green": 0.75,
  Amber: 0.5,
  Red: 0.25,
  "No Paddling": 0.1,
  Unknown: 0.1,
};

export const findLevelDescription = (level: number): string => {
  const allLevels = Object.keys(levelDescriptions)
    .map(parseFloat)
    .sort((a, b) => a - b);

  // Find the next level up from current level
  const nextLevelUp = allLevels.find((key) => key > level);

  // If we're below the lowest level, return the lowest level description
  if (!nextLevelUp) {
    return levelDescriptions[allLevels[0]];
  }

  // Get the difference between current level and the next level up
  const gap = nextLevelUp - level;

  // If gap is significant (> 0.1m), indicate the level this description is for
  const description = levelDescriptions[nextLevelUp];
  if (gap > 0.1) {
    return `${description} (at ${nextLevelUp.toFixed(2)}m)`;
  }

  return description;
};

// --- New RAG calculation logic based on old application ---

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

export const calculateInitialRagStatus = (level: number): number => {
  if (level < 1.0) return 0;
  if (level < 1.4) return 1;
  if (level < 2.2) return 2;
  return 3;
};

const getWeatherConditions = (
  temp: number,
  wind: number,
  isRainy: boolean
): {
  temperatureConditions: string;
  weatherConditions: string;
  reasons: string[];
} => {
  const reasons: string[] = [];
  let temperatureConditions: string;

  if (temp >= 13) {
    temperatureConditions = "high";
  } else if (temp >= 5) {
    temperatureConditions = "moderate";
    reasons.push("Moderately low temperature");
  } else {
    temperatureConditions = "low";
    reasons.push("Low temperature");
  }

  let weatherConditions: string;
  if (wind >= 15) {
    weatherConditions = "windy";
    reasons.push("High winds");
  } else if (temperatureConditions !== "high" && isRainy) {
    weatherConditions = "rainy";
    reasons.push("Rain");
  } else {
    weatherConditions = "calm";
  }

  return { temperatureConditions, weatherConditions, reasons };
};

const adjustRagForConditions = (
  baseRag: number,
  isDark: boolean,
  visibility: number, // in metres
  weatherCode: number,
  weatherReasons: string[]
): { ragNumber: number; reasons: string[] } => {
  let ragNumber = baseRag;
  const reasons = [...weatherReasons];

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
    riverLevel === undefined ||
    temperature === undefined ||
    windSpeed === undefined ||
    rain === undefined ||
    dark === undefined ||
    visibility === undefined ||
    weatherCode === undefined
  ) {
    return { status: "Unknown", reasons: ["Missing data"] };
  }

  // Overriding conditions
  if (riverLevel >= 5.0) {
    return {
      status: "No Paddling",
      reasons: ["River level is dangerously high"],
    };
  }
  // Thunder weather codes in Open-Meteo are 95, 96, 99
  if ([95, 96, 99].includes(weatherCode)) {
    return { status: "No Paddling", reasons: ["Risk of thunderstorms"] };
  }

  const initialRag = calculateInitialRagStatus(riverLevel);
  const {
    temperatureConditions,
    weatherConditions,
    reasons: weatherReasons,
  } = getWeatherConditions(temperature, windSpeed, rain);

  const finalRag =
    CRITERIA_TABLE[temperatureConditions]?.[weatherConditions]?.[initialRag];

  if (finalRag === undefined) {
    return {
      status: "Unknown",
      reasons: ["Could not determine conditions from criteria table"],
    };
  }

  const { ragNumber, reasons } = adjustRagForConditions(
    finalRag,
    dark,
    visibility,
    weatherCode,
    weatherReasons
  );

  const finalStatus = RAG_STATUS_MAP[ragNumber] || "Unknown";

  if (initialRag === 1) {
    reasons.unshift("Slightly elevated river level");
  } else if (initialRag === 2) {
    reasons.unshift("Moderately elevated river level");
  } else if (initialRag === 3) {
    reasons.unshift("Significantly elevated river level");
  }

  return { status: finalStatus, reasons };
};

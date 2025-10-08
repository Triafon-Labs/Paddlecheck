import { KayakConditions, Status } from "@/types";
import {
  RAG_STATUS_MAP,
  CRITERIA_TABLE,
  LEVEL_DESCRIPTIONS,
  THRESHOLDS,
  RAG_STATUS_UI,
  REASON_ICONS,
  RAG_HEIGHT_MAP,
} from "./config";

export {
  RAG_STATUS_MAP,
  LEVEL_DESCRIPTIONS,
  RAG_STATUS_UI as ragStatus,
  REASON_ICONS as reasonIcons,
  RAG_HEIGHT_MAP as ragHeight,
};

// --- Helper Functions for RAG Calculation ---

export const findLevelDescription = (level: number): string => {
  const allLevels = Object.keys(LEVEL_DESCRIPTIONS)
    .map(parseFloat)
    .sort((a, b) => a - b);
  const nextLevelUp = allLevels.find((key) => key > level);
  if (!nextLevelUp) return LEVEL_DESCRIPTIONS[allLevels[0]];
  const gap = nextLevelUp - level;
  const description = LEVEL_DESCRIPTIONS[nextLevelUp];
  return gap > 0.1
    ? `${description} (applies at ${nextLevelUp.toFixed(2)}m)`
    : description;
};

export const calculateInitialRagStatus = (level: number): number => {
  if (level < THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_1) return 0;
  if (level < THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_2) return 1;
  if (level < THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_3) return 2;
  return 3;
};

const getTemperatureConditions = (
  temp: number
): { tempCondition: string; reason?: string } => {
  if (temp >= THRESHOLDS.TEMP_HIGH) return { tempCondition: "high" };
  if (temp >= THRESHOLDS.TEMP_MODERATE)
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
  if (wind >= THRESHOLDS.WIND_HIGH)
    return { weatherCondition: "windy", reason: "High winds" };
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
  const isFoggy =
    visibility < THRESHOLDS.VISIBILITY_POOR ||
    THRESHOLDS.FOG_CODES.includes(weatherCode);
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

  if (riverLevel! >= THRESHOLDS.RIVER_LEVEL_NO_PADDLING) {
    return {
      status: "No Paddling",
      reasons: ["River level is dangerously high"],
    };
  }
  if (THRESHOLDS.THUNDERSTORM_CODES.includes(weatherCode!)) {
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

  const finalRag =
    CRITERIA_TABLE[tempCondition]?.[weatherCondition]?.[initialRag];
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
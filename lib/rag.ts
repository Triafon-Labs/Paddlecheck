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
  if (level <= 1.0) return LEVEL_DESCRIPTIONS[1.0];

  const allLevels = Object.keys(LEVEL_DESCRIPTIONS)
    .map(parseFloat)
    .sort((a, b) => a - b);

  const nextLevelUp = allLevels.find((key) => key >= level);

  if (!nextLevelUp) {
    return LEVEL_DESCRIPTIONS[allLevels[allLevels.length - 1]];
  }

  const description = LEVEL_DESCRIPTIONS[nextLevelUp];
  const gap = nextLevelUp - level;

  return gap > 0.1
    ? `${description} (applies at ${nextLevelUp.toFixed(2)} m)`
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
  if (initialRag === 1)
    return `Slightly elevated river level (> ${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_1} m)`;
  if (initialRag === 2)
    return `Moderately elevated river level (> ${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_2} m)`;
  if (initialRag === 3)
    return `Significantly elevated river level (> ${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_3} m)`;
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

// Informational only: what the RAG status would be if the gust speed were
// the sustained wind speed. Never fed back into the real RAG calculation -
// a gust isn't sustained wind, so it shouldn't move the actual status.
export const getGustStatus = (
  conditions: Partial<KayakConditions>
): Status | undefined => {
  const { windGust } = conditions;
  if (windGust === undefined || windGust < THRESHOLDS.WIND_GUST_NOTABLE) {
    return undefined;
  }
  return calculateFinalRagStatus({ ...conditions, windSpeed: windGust }).status;
};

// Rain is only counted towards the RAG when it's not warm (see
// getWeatherConditions above) - above TEMP_HIGH it's dropped entirely, so
// there'd otherwise be no signal at all that it's raining.
export const isRainWhileWarm = (
  conditions: Partial<KayakConditions>
): boolean => {
  const { temperature, rain } = conditions;
  if (temperature === undefined || !rain) return false;
  return temperature >= THRESHOLDS.TEMP_HIGH;
};

// Appends the underlying reading to a reason string for display, e.g.
// "High winds (18.0 mph)". Reason text itself stays untouched everywhere
// else (icon lookup, "Dark" checks, etc.) - this is purely a UI label.
export const describeReason = (
  reason: string,
  values: { temperature?: number; windSpeed?: number }
): string => {
  if (reason === "High winds" && values.windSpeed !== undefined) {
    return `${reason} (${values.windSpeed.toFixed(1)} mph)`;
  }
  if (
    (reason === "Low temperature" || reason === "Moderately low temperature") &&
    values.temperature !== undefined
  ) {
    return `${reason} (${values.temperature.toFixed(1)}°C)`;
  }
  return reason;
};

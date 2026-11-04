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
import { formatRiverLevel, whole } from "./units";

export {
  RAG_STATUS_MAP,
  LEVEL_DESCRIPTIONS,
  RAG_STATUS_UI as ragStatus,
  REASON_ICONS as reasonIcons,
  RAG_HEIGHT_MAP as ragHeight,
};

// --- Helper Functions for RAG Calculation ---

export const findLevelDescription = (level: number): string | undefined => {
  const allLevels = Object.keys(LEVEL_DESCRIPTIONS)
    .map(parseFloat)
    .sort((a, b) => a - b);

  // No landmarks recorded yet (a fresh adaptation): nothing to say.
  if (allLevels.length === 0) return undefined;
  // At or below the lowest landmark, that landmark applies as-is.
  if (level <= allLevels[0]) return LEVEL_DESCRIPTIONS[allLevels[0]];

  const nextLevelUp = allLevels.find((key) => key >= level);

  if (!nextLevelUp) {
    return LEVEL_DESCRIPTIONS[allLevels[allLevels.length - 1]];
  }

  const description = LEVEL_DESCRIPTIONS[nextLevelUp];
  const gap = nextLevelUp - level;

  return gap > 0.1
    ? `${description} (applies at ${formatRiverLevel(nextLevelUp)})`
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
  // Strictly greater than, not >=. The club table's bands read "5-12" and
  // "5 or less", which overlap at exactly 5; the club reads the middle band as
  // starting above 5, so 5 falls to "low" and takes the stricter row.
  if (temp > THRESHOLDS.TEMP_MODERATE)
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
    return `Slightly elevated river level (> ${formatRiverLevel(THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_1)})`;
  if (initialRag === 2)
    return `Moderately elevated river level (> ${formatRiverLevel(THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_2)})`;
  if (initialRag === 3)
    return `Significantly elevated river level (> ${formatRiverLevel(THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_3)})`;
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
    return { status: "No Paddling", reasons: ["Thunderstorms"] };
  }

  const initialRag = calculateInitialRagStatus(riverLevel!);
  // Judged on the whole numbers the app displays, so a reading shown as
  // "15 mph" or "5°C" always gets the status that figure implies.
  const { tempCondition, reason: tempReason } = getTemperatureConditions(
    whole(temperature!)
  );
  const { weatherCondition, reason: weatherReason } = getWeatherConditions(
    whole(windSpeed!),
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

// Rain is only counted towards the RAG when it's not warm (see
// getWeatherConditions above) - above TEMP_HIGH it's dropped entirely, so
// there'd otherwise be no signal at all that it's raining.
export const isRainWhileWarm = (
  conditions: Partial<KayakConditions>
): boolean => {
  const { temperature, rain } = conditions;
  if (temperature === undefined || !rain) return false;
  return whole(temperature) >= THRESHOLDS.TEMP_HIGH;
};

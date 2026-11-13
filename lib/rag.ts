import { KayakConditions, ReasonChange, Status, StatusStep } from "@/types";
import {
  CRITERIA_TABLE,
  LEVEL_DESCRIPTIONS,
  THRESHOLDS,
  REASON_ICONS,
  RULES,
  STATUS_STEPS,
  UNKNOWN_STATUS,
} from "./config";
import { formatRiverLevel, whole } from "./units";

export { LEVEL_DESCRIPTIONS };

// --- The status scale (STATUS_STEPS in lib/config.ts) ---

const STEPS: readonly StatusStep[] = STATUS_STEPS;

// Every step's name, best first.
export const STEP_NAMES = STEPS.map((step) => step.name) as Status[];
// The last step: reached only by the river passing its fromLevel, or a
// thunderstorm. Weather, darkness and fog stop one step short of it.
export const TOP_STEP = STEP_NAMES[STEP_NAMES.length - 1];
const TOP_INDEX = STEPS.length - 1;
// The steps that count as a good time to paddle in the forecast summaries.
export const BEST_TIME_STEPS = STEPS.filter((step) => step.bestTimes).map(
  (step) => step.name
) as Status[];
// The level at which the river first counts as a contributing factor.
export const FIRST_ELEVATED_LEVEL = STEPS[1]?.fromLevel ?? Infinity;

type StatusUi = Omit<StatusStep, "fromLevel" | "riverDescription">;

// How a status looks. A name that's no longer in STATUS_STEPS - e.g. one
// cached before a step was renamed - is shown as Unknown.
export const statusUi = (status: Status | string): StatusUi =>
  STEPS.find((step) => step.name === status) ?? UNKNOWN_STATUS;

export const statusLabel = (status: Status | string): string =>
  statusUi(status).name;

// Bar height in the forecast chart: full for the best step down to a stub for
// the top one, evenly spaced between (1, 0.75, 0.5, 0.25, 0.1 for five).
export const ragHeight = (status: Status): number => {
  const i = STEP_NAMES.indexOf(status);
  if (i === -1 || i === TOP_INDEX) return 0.1;
  return TOP_INDEX <= 1 ? 1 : 1 - (0.75 * i) / (TOP_INDEX - 1);
};

// Contributing-factor icons: the weather ones from REASON_ICONS, and one per
// step for its river level reason.
export const reasonIcons: Record<string, React.ElementType> = {
  ...REASON_ICONS,
  ...Object.fromEntries(
    STEPS.flatMap((step, i) => {
      const reason = riverLevelReason(i);
      return reason && step.reasonIcon ? [[reason, step.reasonIcon]] : [];
    })
  ),
};

function riverLevelReason(stepIndex: number): string | undefined {
  const step = STEPS[stepIndex];
  if (stepIndex === 0 || !step?.riverReason) return undefined;
  return `${step.riverReason} river level (> ${formatRiverLevel(step.fromLevel)})`;
}

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

// The step the river level alone puts conditions on, as an index into
// STATUS_STEPS. Never the top step - that's handled before this is asked.
export const calculateInitialRagStatus = (level: number): number => {
  let index = 0;
  for (let i = 1; i < TOP_INDEX; i++) {
    if (level >= STEPS[i].fromLevel) index = i;
  }
  return index;
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
): {
  ragNumber: number;
  reasons: string[];
  changes: Record<string, [number, number]>;
} => {
  let ragNumber = baseRag;
  const reasons: string[] = [];
  const changes: Record<string, [number, number]> = {};
  // Each raises one step, but never to the top step - so a factor that hits
  // that cap is recorded as changing nothing.
  const raise = (reason: string) => {
    const next = Math.min(ragNumber + 1, Math.max(TOP_INDEX - 1, ragNumber));
    reasons.push(reason);
    changes[reason] = [ragNumber, next];
    ragNumber = next;
  };
  if (isDark && RULES.DARKNESS) raise("Dark");
  const isFoggy =
    RULES.FOG &&
    (visibility < THRESHOLDS.VISIBILITY_POOR ||
      THRESHOLDS.FOG_CODES.includes(weatherCode));
  if (isFoggy) raise("Foggy");
  return { ragNumber, reasons, changes };
};

// --- Main RAG Calculation Function ---

// The status and the reasons for it. `reasonChanges` says which status each
// reason moved conditions from and to, so the Contributing Factors read as a
// chain ending on the status shown: the river level counts from the first
// step; temperature is its band's calm row against the river level's own
// step; wind or rain is the difference between its row and the calm one (the
// weather table gives one combined result, so this is how it's split);
// darkness and fog one step each, less where the cap below the top step
// stops them.
export const calculateFinalRagStatus = (
  conditions: Partial<KayakConditions>
): {
  status: Status;
  reasons: string[];
  reasonChanges?: Record<string, ReasonChange>;
} => {
  const {
    riverLevel,
    temperature,
    windSpeed,
    rain,
    dark,
    visibility,
    weatherCode,
  } = conditions;

  // Only the readings the club's rules use are required: with the weather
  // table off, say, a missing wind reading mustn't make the status Unknown.
  const needed = [
    riverLevel,
    ...(RULES.WEATHER_TABLE ? [temperature, windSpeed, rain] : []),
    ...(RULES.DARKNESS ? [dark] : []),
    ...(RULES.FOG ? [visibility, weatherCode] : []),
    ...(RULES.THUNDERSTORMS ? [weatherCode] : []),
  ];
  if (needed.some((v) => v === undefined)) {
    return { status: "Unknown", reasons: ["Missing data"] };
  }

  if (riverLevel! >= STEPS[TOP_INDEX].fromLevel) {
    return {
      status: TOP_STEP,
      reasons: ["River level is dangerously high"],
    };
  }
  if (
    RULES.THUNDERSTORMS &&
    THRESHOLDS.THUNDERSTORM_CODES.includes(weatherCode!)
  ) {
    return { status: TOP_STEP, reasons: ["Thunderstorms"] };
  }

  const initialRag = calculateInitialRagStatus(riverLevel!);

  // With the weather table off, the river level's own step stands and
  // temperature, wind and rain aren't given as reasons.
  let finalRag: number | undefined = initialRag;
  const weatherReasons: (string | undefined)[] = [];
  const changes: Record<string, [number, number]> = {};
  const riverReason = riverLevelReason(initialRag);
  if (riverReason) changes[riverReason] = [0, initialRag];
  if (RULES.WEATHER_TABLE) {
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
    const row = CRITERIA_TABLE[tempCondition];
    finalRag = row?.[weatherCondition]?.[initialRag];
    weatherReasons.push(tempReason, weatherReason);
    // With no temperature reason (warm), wind takes the whole change from
    // the river level's step, so the chain never skips a step no reason
    // explains - even for a club whose warm calm row isn't the river's own.
    const calmRag = tempReason ? row?.calm?.[initialRag] : initialRag;
    if (calmRag !== undefined && finalRag !== undefined) {
      if (tempReason) changes[tempReason] = [initialRag, calmRag];
      if (weatherReason) changes[weatherReason] = [calmRag, finalRag];
    }
  }
  if (finalRag === undefined) {
    return {
      status: "Unknown",
      reasons: ["Could not determine conditions"],
    };
  }

  // Readings a switched-off rule doesn't need may be missing; these stand-ins
  // are never looked at, since adjustRagForFactors checks RULES first.
  const {
    ragNumber,
    reasons: adjustmentReasons,
    changes: adjustmentChanges,
  } = adjustRagForFactors(
    finalRag,
    dark === true,
    visibility ?? Infinity,
    weatherCode ?? -1
  );

  const allReasons = [
    riverReason,
    ...weatherReasons,
    ...adjustmentReasons,
  ].filter(Boolean) as string[];

  return {
    status: STEP_NAMES[ragNumber] ?? "Unknown",
    reasons: allReasons,
    reasonChanges: Object.fromEntries(
      Object.entries({ ...changes, ...adjustmentChanges }).map(
        ([reason, [from, to]]) => [
          reason,
          { from: STEP_NAMES[from], to: STEP_NAMES[to] },
        ]
      )
    ),
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

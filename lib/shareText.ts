import { DayForecast, KayakConditions } from "@/types";
import { degreesToCompass } from "@/lib/weather";
import { statusUi, statusLabel, FIRST_ELEVATED_LEVEL } from "@/lib/rag";
import { THRESHOLDS, APP_NAME } from "@/lib/config";
import {
  formatRiverLevel,
  formatTemperature,
  formatWindSpeed,
} from "@/lib/units";
import { buildBestConditionsLine } from "@/lib/forecast";

// What the share button sends, in the order the Paddling Status card reads:
// the status, the river level and its trend, what pushed the status up,
// warnings, the weather, then when it's best to get on the water.

// The river trend in the card's words (StatusCard's River Level heading).
const trendWord = (change: number): string =>
  change > THRESHOLDS.RIVER_LEVEL_TREND_THRESHOLD
    ? "rising"
    : change < -THRESHOLDS.RIVER_LEVEL_TREND_THRESHOLD
      ? "falling"
      : "steady";

export const buildShareText = (
  conditions: KayakConditions | null,
  forecastDays: DayForecast[] | null
): string => {
  if (!conditions) return `Check current paddling conditions at ${APP_NAME}.`;

  const lines: string[] = [];
  const status = conditions.overallStatus;
  const emoji = statusUi(status).emoji;
  lines.push(
    `*Paddling status: ${statusLabel(status)}*${emoji ? ` ${emoji}` : ""}`
  );

  // What raised it above the river level's own step - the card's
  // Contributing Factors, by name.
  const reasons = conditions.reasons ?? [];
  if (reasons.length > 0) {
    const base = conditions.initialStatus;
    lines.push(
      base && base !== status
        ? `Raised from ${statusLabel(base)} by: ${reasons.join(", ")}`
        : `Factors: ${reasons.join(", ")}`
    );
  }
  lines.push("");

  if (conditions.riverLevel !== undefined) {
    let riverLine = `🛶 River level: ${formatRiverLevel(conditions.riverLevel)}`;
    if (conditions.levelChange) {
      const { value, period } = conditions.levelChange;
      const trend = trendWord(value);
      riverLine +=
        trend === "steady"
          ? `, steady`
          : `, ${trend} (${value > 0 ? "+" : "−"}${formatRiverLevel(Math.abs(value))} in ${period})`;
    }
    lines.push(riverLine);
    // The landmark only once the river's up: at a normal level it's
    // "launch OK", which says nothing the status doesn't.
    if (
      conditions.launchMessage &&
      conditions.riverLevel >= FIRST_ELEVATED_LEVEL
    ) {
      lines.push(`📍 ${conditions.launchMessage}`);
    }
  }

  const weather = [
    conditions.temperature !== undefined
      ? `🌡️ ${formatTemperature(conditions.temperature)}`
      : null,
    conditions.windSpeed !== undefined
      ? `💨 ${formatWindSpeed(conditions.windSpeed)}${
          conditions.windDirection !== undefined
            ? ` ${degreesToCompass(conditions.windDirection)}`
            : ""
        }`
      : null,
  ]
    .filter(Boolean)
    .join("  ");
  if (weather) lines.push(weather);

  const warnings = Array.from(
    new Set(
      (conditions.warnings ?? []).map(
        (w) => `⚠️ ${w.severity} warning: ${w.headline}`
      )
    )
  );
  lines.push(...warnings);

  const best = buildBestConditionsLine(
    forecastDays,
    status,
    conditions.reasons
  );
  if (best) {
    lines.push("");
    lines.push(`🕒 ${best}`);
  }

  return lines.join("\n");
};

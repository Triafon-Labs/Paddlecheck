import { DayForecast, Status } from "@/types";
import { THRESHOLDS } from "@/lib/config";
import {
  formatRiverLevel,
  formatTemperature,
  formatWindSpeed,
  formatWindGust,
} from "@/lib/units";
import { getLondonHHMM, getLondonHour, hhmmOfISO } from "@/lib/time";

const PREFERRED: Status[] = ["Light Green", "Dark Green"];

const hourOf = (time: string) => parseInt(time.split(":")[0], 10);
const fmtHour = (h: number) =>
  `${String(((h % 24) + 24) % 24).padStart(2, "0")}:00`;
const isDarkOnly = (reasons: string[]) =>
  reasons.length === 1 && reasons[0] === "Dark";

const slotAtHour = (graphData: DayForecast["graphData"], hour: number) =>
  graphData.find((pt) => hourOf(pt.time) === hour);

interface Window {
  startHour: number;
  endHour: number;
}

interface StatusBlock extends Window {
  status: Status;
  reasons: string[];
}

// Splits chronologically-ordered slots into contiguous same-status runs,
// merging each run's non-"Dark" reasons together.
function findStatusBlocks(slots: DayForecast["graphData"]): StatusBlock[] {
  const blocks: StatusBlock[] = [];

  for (const pt of slots) {
    const h = hourOf(pt.time);
    const reasons = pt.reasons.filter((r) => r !== "Dark");
    const last = blocks[blocks.length - 1];

    if (last && last.status === pt.status) {
      last.endHour = h;
      for (const r of reasons) {
        if (!last.reasons.includes(r)) last.reasons.push(r);
      }
    } else {
      blocks.push({ status: pt.status, startHour: h, endHour: h, reasons });
    }
  }

  return blocks;
}

// Find contiguous runs of the best available green status among the given
// (chronologically ordered) slots, plus the block(s) of worse status that
// separate consecutive windows, if any.
function findGreenWindows(slots: DayForecast["graphData"]): {
  bestStatus: Status | null;
  windows: Window[];
  gaps: StatusBlock[][];
} {
  const blocks = findStatusBlocks(slots);
  const bestStatus =
    PREFERRED.find((s) => blocks.some((b) => b.status === s)) ?? null;
  if (!bestStatus) return { bestStatus: null, windows: [], gaps: [] };

  const bestIndices = blocks
    .map((b, i) => (b.status === bestStatus ? i : -1))
    .filter((i) => i !== -1);

  const windows = bestIndices.map((i) => ({
    startHour: blocks[i].startHour,
    endHour: blocks[i].endHour,
  }));

  // Every pair of consecutive best-status blocks is necessarily separated by
  // at least one worse-status block, since findStatusBlocks would otherwise
  // have merged them into a single run.
  const gaps: StatusBlock[][] = [];
  for (let k = 0; k < bestIndices.length - 1; k++) {
    gaps.push(blocks.slice(bestIndices[k] + 1, bestIndices[k + 1]));
  }

  return { bestStatus, windows, gaps };
}

// Format a window's start/end, extending to actual sunrise/sunset when the
// adjacent hour is dark-only (conditions are valid right up to the sun).
// When isNow is true, renders "now" as the start instead of a clock time.
function formatWindow(
  graphData: DayForecast["graphData"],
  w: Window,
  sunriseHHMM: string | null,
  sunsetHHMM: string | null,
  isNow: boolean
): { start: string; end: string } {
  let start: string;
  const prev = slotAtHour(graphData, w.startHour - 1);
  const isSunrise = sunriseHHMM && prev && isDarkOnly(prev.reasons);

  if (isNow) {
    start = "now";
  } else if (isSunrise) {
    start = sunriseHHMM;
  } else {
    start = fmtHour(w.startHour);
  }

  const next = slotAtHour(graphData, w.endHour + 1);
  const isSunset = sunsetHHMM && next && isDarkOnly(next.reasons);
  const end = isSunset ? sunsetHHMM : fmtHour(w.endHour + 1);

  return { start, end };
}

// Describes the block(s) of worse-status conditions that separate best-status
// windows, e.g. "17:00–18:00 dark green due to High winds". Gaps are always
// interior to the daylight period, so no sunrise/sunset substitution applies.
function formatGaps(
  graphData: DayForecast["graphData"],
  gaps: StatusBlock[][]
): string | null {
  if (gaps.length === 0) return null;

  const describeBlock = (b: StatusBlock) => {
    const { start, end } = formatWindow(graphData, b, null, null, false);
    const label = b.status.toLowerCase();
    const reasonText =
      b.reasons.length > 0 ? ` due to ${b.reasons.join(", ")}` : "";
    return `${start}–${end} ${label}${reasonText}`;
  };

  return gaps
    .map((blocks) => blocks.map(describeBlock).join(" then "))
    .join("; ");
}

export interface BestPaddlingTimes {
  text: string; // "Best conditions today: 09:00–17:00 (light green)"
  gapsText: string | null; // "17:00–18:00 dark green due to High winds"
}

// Best paddling windows for the rest of today, relative to the current time.
// currentStatus is today's live overall status (not the forecast): the
// hour we're currently in is always excluded from todayForecast's hourly
// data (see hooks.ts), so there's no forecast slot to compare against "now"
// - this is what lets us tell whether the first forecast window is really a
// continuation of a window already under way right now.
export function buildBestPaddlingTimes(
  todayForecast: DayForecast | null,
  currentStatus?: Status
): BestPaddlingTimes | null {
  if (!todayForecast) return null;

  const nowHour = getLondonHour();
  const futureSlots = todayForecast.graphData.filter(
    (pt) => hourOf(pt.time) >= nowHour && !pt.reasons.includes("Dark")
  );
  if (futureSlots.length === 0) return null;

  const { bestStatus, windows, gaps } = findGreenWindows(futureSlots);
  if (!bestStatus || windows.length === 0) return null;

  const alreadyUnderway =
    currentStatus === bestStatus && futureSlots[0].status === bestStatus;

  const sunriseHHMM = todayForecast.sunrise
    ? hhmmOfISO(todayForecast.sunrise)
    : null;
  const sunsetHHMM = todayForecast.sunset
    ? hhmmOfISO(todayForecast.sunset)
    : null;
  const label = bestStatus === "Light Green" ? "light green" : "dark green";

  const ranges = windows
    .map((w, i) => {
      const { start, end } = formatWindow(
        todayForecast.graphData,
        w,
        sunriseHHMM,
        sunsetHHMM,
        i === 0 && alreadyUnderway
      );
      let note = "";
      if (start === "now") {
        // Window times are London clock times, so "now" must be too - the
        // visitor's local getHours() would skew this outside UK time.
        const [nowH, nowM] = getLondonHHMM().split(":").map(Number);
        const [endH, endM] = end.split(":").map(Number);
        const remaining = endH * 60 + endM - (nowH * 60 + nowM);
        if (remaining > 0 && remaining < 60) {
          note = ` – only ~${remaining} min remaining`;
        }
      }
      return `${start}–${end}${note}`;
    })
    .join(", ");

  return {
    text: `Best conditions today: ${ranges} (${label})`,
    gapsText: formatGaps(todayForecast.graphData, gaps),
  };
}

// Hour-by-hour forecast text for today's remaining daylight, for the AI
// briefing. Deliberately status-free: the briefing summarises raw river and
// weather conditions, so RAG statuses and their reasons are left out.
export function buildHourlyForecastText(
  todayForecast: DayForecast
): string | null {
  const slots = todayForecast.graphData.filter(
    (pt) => !pt.reasons.includes("Dark")
  );
  if (slots.length === 0) return null;

  const sunsetHHMM = todayForecast.sunset
    ? hhmmOfISO(todayForecast.sunset)
    : null;

  const lines = slots.map((pt, i) => {
    const h = hourOf(pt.time);
    const timeStr = `${String(h).padStart(2, "0")}:00`;
    const level = `river ${formatRiverLevel(pt.forecastLevel)}`;
    const temp =
      pt.temperature !== undefined ? formatTemperature(pt.temperature) : null;
    const wind =
      pt.windSpeed !== undefined
        ? `${formatWindSpeed(pt.windSpeed)} wind`
        : null;
    const gust =
      pt.windGust !== undefined && pt.windGust >= THRESHOLDS.WIND_GUST_NOTABLE
        ? `gusts up to ${formatWindGust(pt.windGust)}`
        : null;
    const weather = pt.weatherDescription ?? null;
    const stats = [level, temp, wind, gust, weather].filter(Boolean).join(", ");
    // The final daylight hour's conditions persist until sunset; later hours
    // are omitted only because it gets dark.
    const sunsetNote =
      i === slots.length - 1 && sunsetHHMM
        ? ` (these conditions hold until sunset at ${sunsetHHMM})`
        : "";
    return `${timeStr} – ${stats}${sunsetNote}`;
  });

  return lines.join("\n");
}

// True if there are any non-dark slots still to come today.
export function hasDaylightRemaining(
  todayForecast: DayForecast | null
): boolean {
  if (!todayForecast) return false;
  const nowHour = getLondonHour();
  return todayForecast.graphData.some(
    (pt) => hourOf(pt.time) >= nowHour && !pt.reasons.includes("Dark")
  );
}

// How a forecast day reads in prose, relative to today. Only the first two
// days are ever reachable: it's dark either before sunrise (daylight still to
// come today) or after sunset (the next daylight is tomorrow's), and no day
// here is dark throughout.
export const relativeDayLabel = (dayIndex: number): string =>
  dayIndex === 0 ? "later today" : "tomorrow";

export interface DaytimeOutlook {
  dayLabel: string; // "later today" | "tomorrow"
  bestTimes: string | null; // "09:00–17:00 (light green)" or null
  rangesText: string; // "river level between 0.55 m and 0.62 m, air temperature between 11.0°C and 18.0°C, wind up to 14.0 mph"
  gapsText: string | null; // "17:00–18:00 dark green due to High winds"
}

// Outlook for the next daytime period – used when it's currently dark.
// Picks the first forecast day that still has daylight hours.
export function buildNextDaytimeOutlook(
  forecastDays: DayForecast[] | null
): DaytimeOutlook | null {
  if (!forecastDays || forecastDays.length === 0) return null;

  const dayIndex = forecastDays.findIndex((day) =>
    day.graphData.some((pt) => !pt.reasons.includes("Dark"))
  );
  if (dayIndex === -1) return null;

  const day = forecastDays[dayIndex];
  const daySlots = day.graphData.filter((pt) => !pt.reasons.includes("Dark"));
  if (daySlots.length === 0) return null;

  const dayLabel = relativeDayLabel(dayIndex);

  const levels = daySlots.map((s) => s.forecastLevel);
  const minL = Math.min(...levels);
  const maxL = Math.max(...levels);
  const levelText =
    maxL - minL < THRESHOLDS.RIVER_LEVEL_TREND_THRESHOLD
      ? `river level steady around ${formatRiverLevel(minL)}`
      : `river level between ${formatRiverLevel(minL)} and ${formatRiverLevel(maxL)}`;

  const temps = daySlots
    .map((s) => s.temperature)
    .filter((t): t is number => typeof t === "number");
  const minTemp = temps.length ? Math.min(...temps) : null;
  const maxTemp = temps.length ? Math.max(...temps) : null;
  const tempText =
    minTemp !== null && maxTemp !== null
      ? maxTemp - minTemp < 2
        ? `air temperature steady around ${formatTemperature(minTemp)}`
        : `air temperature between ${formatTemperature(minTemp)} and ${formatTemperature(maxTemp)}`
      : null;

  const winds = daySlots
    .map((s) => s.windSpeed)
    .filter((w): w is number => typeof w === "number");
  const windText = winds.length
    ? `wind up to ${formatWindSpeed(Math.max(...winds))}`
    : null;

  const gusts = daySlots
    .map((s) => s.windGust)
    .filter((g): g is number => typeof g === "number");
  const maxGust = gusts.length ? Math.max(...gusts) : null;
  const gustText =
    maxGust !== null && maxGust >= THRESHOLDS.WIND_GUST_NOTABLE
      ? `gusts up to ${formatWindGust(maxGust)}`
      : null;

  const rainWhileWarmText = daySlots.some((s) => s.rainWhileWarm)
    ? "warm rain at times"
    : null;

  const rangesText = [
    levelText,
    tempText,
    windText,
    gustText,
    rainWhileWarmText,
  ]
    .filter(Boolean)
    .join(", ");

  const { bestStatus, windows, gaps } = findGreenWindows(daySlots);
  let bestTimes: string | null = null;
  let gapsText: string | null = null;
  if (bestStatus && windows.length > 0) {
    const sunriseHHMM = day.sunrise ? hhmmOfISO(day.sunrise) : null;
    const sunsetHHMM = day.sunset ? hhmmOfISO(day.sunset) : null;
    const label = bestStatus === "Light Green" ? "light green" : "dark green";
    const ranges = windows
      .map((w) => {
        const { start, end } = formatWindow(
          day.graphData,
          w,
          sunriseHHMM,
          sunsetHHMM,
          false
        );
        return `${start}–${end}`;
      })
      .join(", ");
    bestTimes = `${ranges} (${label})`;
    gapsText = formatGaps(day.graphData, gaps);
  }

  return { dayLabel, bestTimes, rangesText, gapsText };
}

// One line naming the best paddling window(s) still to come: the rest of
// today while there's daylight left, otherwise the next daylight period.
// Shared by the share text and the conditions report, so both always agree.
// Null when no green hours are forecast in that period.
export function buildBestConditionsLine(
  forecastDays: DayForecast[] | null,
  currentStatus?: Status
): string | null {
  const todayForecast = forecastDays?.[0] ?? null;
  if (hasDaylightRemaining(todayForecast)) {
    return buildBestPaddlingTimes(todayForecast, currentStatus)?.text ?? null;
  }
  const outlook = buildNextDaytimeOutlook(forecastDays);
  return outlook?.bestTimes
    ? `Best conditions ${outlook.dayLabel}: ${outlook.bestTimes}`
    : null;
}

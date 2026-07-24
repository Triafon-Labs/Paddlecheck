import { DayForecast, Status } from "@/types";
import { THRESHOLDS } from "@/lib/config";
import { findLevelDescription } from "@/lib/rag";
import { getLondonHour, hhmmOfISO } from "@/lib/time";

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

// Find contiguous runs of the best available green status among the given
// (chronologically ordered) slots.
function findGreenWindows(slots: DayForecast["graphData"]): {
  bestStatus: Status | null;
  windows: Window[];
} {
  const bestStatus =
    PREFERRED.find((s) => slots.some((pt) => pt.status === s)) ?? null;
  if (!bestStatus) return { bestStatus: null, windows: [] };

  const windows: Window[] = [];
  let startHour: number | null = null;
  let lastHour: number | null = null;

  for (const pt of slots) {
    const h = hourOf(pt.time);
    if (pt.status === bestStatus) {
      if (startHour === null) startHour = h;
      lastHour = h;
    } else if (startHour !== null && lastHour !== null) {
      windows.push({ startHour, endHour: lastHour });
      startHour = null;
      lastHour = null;
    }
  }
  if (startHour !== null && lastHour !== null) {
    windows.push({ startHour, endHour: lastHour });
  }

  return { bestStatus, windows };
}

// Format a window's start/end, extending to actual sunrise/sunset when the
// adjacent hour is dark-only (conditions are valid right up to the sun).
// When nowHour is provided and matches the window start, renders "now".
function formatWindow(
  graphData: DayForecast["graphData"],
  w: Window,
  sunriseHHMM: string | null,
  sunsetHHMM: string | null,
  nowHour: number | null
): { start: string; end: string } {
  let start: string;
  const prev = slotAtHour(graphData, w.startHour - 1);
  const isSunrise = sunriseHHMM && prev && isDarkOnly(prev.reasons);

  if (nowHour !== null && w.startHour === nowHour) {
    start = "now";
  } else if (isSunrise) {
    start = "sunrise";
  } else {
    start = fmtHour(w.startHour);
  }

  const next = slotAtHour(graphData, w.endHour + 1);
  const isSunset = sunsetHHMM && next && isDarkOnly(next.reasons);
  const end = isSunset ? "sunset" : fmtHour(w.endHour + 1);

  return { start, end };
}

// Best paddling windows for the rest of today, relative to the current time.
export function buildBestPaddlingTimes(
  todayForecast: DayForecast | null
): string | null {
  if (!todayForecast) return null;

  const now = new Date();
  const nowHour = getLondonHour();
  const futureSlots = todayForecast.graphData.filter(
    (pt) => hourOf(pt.time) >= nowHour && !pt.reasons.includes("Dark")
  );
  if (futureSlots.length === 0) return null;

  const { bestStatus, windows } = findGreenWindows(futureSlots);
  if (!bestStatus || windows.length === 0) return null;

  const sunriseHHMM = todayForecast.sunrise
    ? hhmmOfISO(todayForecast.sunrise)
    : null;
  const sunsetHHMM = todayForecast.sunset ? hhmmOfISO(todayForecast.sunset) : null;
  const label = bestStatus === "Light Green" ? "light green" : "dark green";

  const ranges = windows
    .map((w, i) => {
      const { start, end } = formatWindow(
        todayForecast.graphData,
        w,
        sunriseHHMM,
        sunsetHHMM,
        i === 0 ? nowHour : null
      );
      let note = "";
      if (start === "now") {
        const [endH, endM] = end.split(":").map(Number);
        const remaining =
          endH * 60 + endM - (now.getHours() * 60 + now.getMinutes());
        if (remaining > 0 && remaining < 60) {
          note = ` – only ~${remaining} mins remaining`;
        }
      }
      return `${start}–${end}${note}`;
    })
    .join(", ");

  return `Best conditions today: ${ranges} (${label})`;
}

// Hour-by-hour forecast text for today's remaining daylight, for the AI briefing.
export function buildHourlyForecastText(
  todayForecast: DayForecast
): string | null {
  const slots = todayForecast.graphData.filter(
    (pt) => !pt.reasons.includes("Dark")
  );
  if (slots.length === 0) return null;

  const sunsetHHMM = todayForecast.sunset ? hhmmOfISO(todayForecast.sunset) : null;

  const lines = slots.map((pt, i) => {
    const h = hourOf(pt.time);
    const timeStr = `${String(h).padStart(2, "0")}:00`;
    const level = `river ${pt.forecastLevel.toFixed(2)} m`;
    const launch = `launch: ${findLevelDescription(pt.forecastLevel)}`;
    const temp =
      pt.temperature !== undefined ? `${Math.round(pt.temperature)}°C` : null;
    const wind =
      pt.windSpeed !== undefined
        ? `${Math.round(pt.windSpeed)} mph wind`
        : null;
    const gust =
      pt.windGust !== undefined && pt.windGust >= THRESHOLDS.WIND_GUST_NOTABLE
        ? `gusts up to ${Math.round(pt.windGust)} mph`
        : null;
    const rainNote = pt.rainWhileWarm ? "rain (warm, no rating impact)" : null;
    const stats = [level, launch, temp, wind, gust, rainNote]
      .filter(Boolean)
      .join(", ");
    const nonDarkReasons = pt.reasons.filter((r) => r !== "Dark");
    const note =
      nonDarkReasons.length > 0 ? ` [${nonDarkReasons.join(", ")}]` : "";
    // The final daylight hour's conditions persist until sunset; later hours
    // are omitted only because it gets dark.
    const sunsetNote =
      i === slots.length - 1 && sunsetHHMM
        ? ` (these conditions hold until sunset at ${sunsetHHMM})`
        : "";
    return `${timeStr} ${pt.status} – ${stats}${note}${sunsetNote}`;
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

export interface DaytimeOutlook {
  dayLabel: string; // "later today" | "tomorrow" | day label
  bestTimes: string | null; // "09:00–17:00 (light green)" or null
  rangesText: string; // "river level 0.55–0.62 m, air temperature 11–18°C, wind up to 14 mph"
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

  const dayLabel =
    dayIndex === 0
      ? "later today"
      : dayIndex === 1
        ? "tomorrow"
        : day.label.toLowerCase();

  const levels = daySlots.map((s) => s.forecastLevel);
  const minL = Math.min(...levels);
  const maxL = Math.max(...levels);
  const levelText =
    maxL - minL < THRESHOLDS.RIVER_LEVEL_TREND_THRESHOLD
      ? `river level steady around ${minL.toFixed(2)} m`
      : `river level between ${minL.toFixed(2)} m and ${maxL.toFixed(2)} m`;

  const temps = daySlots
    .map((s) => s.temperature)
    .filter((t): t is number => typeof t === "number");
  const minTemp = temps.length ? Math.round(Math.min(...temps)) : null;
  const maxTemp = temps.length ? Math.round(Math.max(...temps)) : null;
  const tempText =
    minTemp !== null && maxTemp !== null
      ? maxTemp - minTemp < 2
        ? `air temperature steady around ${minTemp}°C`
        : `air temperature between ${minTemp}°C and ${maxTemp}°C`
      : null;

  const winds = daySlots
    .map((s) => s.windSpeed)
    .filter((w): w is number => typeof w === "number");
  const windText = winds.length
    ? `wind up to ${Math.round(Math.max(...winds))} mph`
    : null;

  const gusts = daySlots
    .map((s) => s.windGust)
    .filter((g): g is number => typeof g === "number");
  const maxGust = gusts.length ? Math.max(...gusts) : null;
  const gustText =
    maxGust !== null && maxGust >= THRESHOLDS.WIND_GUST_NOTABLE
      ? `gusts up to ${Math.round(maxGust)} mph`
      : null;

  const rainWhileWarmText = daySlots.some((s) => s.rainWhileWarm)
    ? "rain at times (warm, no rating impact)"
    : null;

  const rangesText = [levelText, tempText, windText, gustText, rainWhileWarmText]
    .filter(Boolean)
    .join(", ");

  const { bestStatus, windows } = findGreenWindows(daySlots);
  let bestTimes: string | null = null;
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
          null
        );
        return `${start}–${end}`;
      })
      .join(", ");
    bestTimes = `${ranges} (${label})`;
  }

  return { dayLabel, bestTimes, rangesText };
}

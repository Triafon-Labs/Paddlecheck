import { DayForecast, Status } from "@/types";

const PREFERRED: Status[] = ["Light Green", "Dark Green"];

const hourOf = (time: string) => parseInt(time.split(":")[0], 10);
const fmtHour = (h: number) => `${String(((h % 24) + 24) % 24).padStart(2, "0")}:00`;
const hhmmOf = (iso: string) => iso.split("T")[1]?.slice(0, 5) ?? null;
const isDarkOnly = (reasons: string[]) =>
  reasons.length === 1 && reasons[0] === "Dark";

const slotAtHour = (graphData: DayForecast["graphData"], hour: number) =>
  graphData.find((pt) => hourOf(pt.time) === hour);

// Describe how temperature moves across the day. Directional ("rising from X
// to Y") only when the extremes are meaningfully apart and ordered in time;
// otherwise "steady around X".
function describeTemperature(slots: DayForecast["graphData"]): string | null {
  const points = slots
    .map((s) => ({ hour: hourOf(s.time), temp: s.temperature }))
    .filter((p): p is { hour: number; temp: number } => typeof p.temp === "number");
  if (points.length === 0) return null;

  let lo = points[0];
  let hi = points[0];
  for (const p of points) {
    if (p.temp < lo.temp) lo = p;
    if (p.temp > hi.temp) hi = p;
  }
  const loT = Math.round(lo.temp);
  const hiT = Math.round(hi.temp);

  if (hiT - loT < 2) return `air temperature steady around ${loT}°C`;
  if (hi.hour > lo.hour) return `air temperature rising from ${loT}°C to ${hiT}°C`;
  if (hi.hour < lo.hour) return `air temperature falling from ${hiT}°C to ${loT}°C`;
  return `air temperature between ${loT}°C and ${hiT}°C`;
}

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
  const bestStatus = PREFERRED.find((s) => slots.some((pt) => pt.status === s)) ?? null;
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
  if (nowHour !== null && w.startHour === nowHour) {
    start = "now";
  } else {
    const prev = slotAtHour(graphData, w.startHour - 1);
    start = sunriseHHMM && prev && isDarkOnly(prev.reasons) ? sunriseHHMM : fmtHour(w.startHour);
  }

  const next = slotAtHour(graphData, w.endHour + 1);
  const end = sunsetHHMM && next && isDarkOnly(next.reasons) ? sunsetHHMM : fmtHour(w.endHour + 1);

  return { start, end };
}

// Best paddling windows for the rest of today, relative to the current time.
export function buildBestPaddlingTimes(todayForecast: DayForecast | null): string | null {
  if (!todayForecast) return null;

  const now = new Date();
  const nowHour = now.getHours();
  const futureSlots = todayForecast.graphData.filter(
    (pt) => hourOf(pt.time) >= nowHour && !pt.reasons.includes("Dark")
  );
  if (futureSlots.length === 0) return null;

  const { bestStatus, windows } = findGreenWindows(futureSlots);
  if (!bestStatus || windows.length === 0) return null;

  const sunriseHHMM = todayForecast.sunrise ? hhmmOf(todayForecast.sunrise) : null;
  const sunsetHHMM = todayForecast.sunset ? hhmmOf(todayForecast.sunset) : null;
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
        const remaining = endH * 60 + endM - (now.getHours() * 60 + now.getMinutes());
        if (remaining > 0 && remaining < 60) {
          note = ` — only ~${remaining} mins remaining`;
        }
      }
      return `${start}–${end}${note}`;
    })
    .join(", ");

  return `Best conditions today: ${ranges} (${label})`;
}

// True if there are any non-dark slots still to come today.
export function hasDaylightRemaining(todayForecast: DayForecast | null): boolean {
  if (!todayForecast) return false;
  const nowHour = new Date().getHours();
  return todayForecast.graphData.some(
    (pt) => hourOf(pt.time) >= nowHour && !pt.reasons.includes("Dark")
  );
}

export interface DaytimeOutlook {
  dayLabel: string; // "later today" | "tomorrow" | day label
  bestTimes: string | null; // "09:00–17:00 (light green)" or null
  rangesText: string; // "river level 0.55–0.62m, air temperature 11–18°C, wind up to 14 mph"
}

// Outlook for the next daytime period — used when it's currently dark.
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
    dayIndex === 0 ? "later today" : dayIndex === 1 ? "tomorrow" : day.label.toLowerCase();

  const levels = daySlots.map((s) => s.predictedLevel);
  const minL = Math.min(...levels);
  const maxL = Math.max(...levels);
  const levelText =
    maxL - minL < 0.02
      ? `river level steady around ${minL.toFixed(2)}m`
      : `river level between ${minL.toFixed(2)}m and ${maxL.toFixed(2)}m`;

  const tempText = describeTemperature(daySlots);

  const winds = daySlots
    .map((s) => s.windSpeed)
    .filter((w): w is number => typeof w === "number");
  const windText = winds.length ? `wind up to ${Math.round(Math.max(...winds))} mph` : null;

  const rangesText = [levelText, tempText, windText].filter(Boolean).join(", ");

  const { bestStatus, windows } = findGreenWindows(daySlots);
  let bestTimes: string | null = null;
  if (bestStatus && windows.length > 0) {
    const sunriseHHMM = day.sunrise ? hhmmOf(day.sunrise) : null;
    const sunsetHHMM = day.sunset ? hhmmOf(day.sunset) : null;
    const label = bestStatus === "Light Green" ? "light green" : "dark green";
    const ranges = windows
      .map((w) => {
        const { start, end } = formatWindow(day.graphData, w, sunriseHHMM, sunsetHHMM, null);
        return `${start}–${end}`;
      })
      .join(", ");
    bestTimes = `${ranges} (${label})`;
  }

  return { dayLabel, bestTimes, rangesText };
}

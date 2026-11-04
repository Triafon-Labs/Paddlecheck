import { THRESHOLDS } from "./config";

// Minutes on their own are always "min" - "45 min ago". The bare "m" below
// only ever appears welded to an hour ("2h 15m ago"), where it reads as part
// of a compact duration rather than as a unit in its own right; standalone it
// would be one character away from the metres this app quotes river levels in.
export const formatDataAge = (latestTs: number, now: Date): string => {
  const ageMinutes = Math.round((now.getTime() - latestTs) / (60 * 1000));
  if (ageMinutes < 1) return "just now";
  if (ageMinutes < 60) return `${ageMinutes} min ago`;
  const hours = Math.floor(ageMinutes / 60);
  const minutes = ageMinutes % 60;
  if (hours < 24) {
    const duration = minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
    return `${duration} ago`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  const duration = remHours === 0 ? `${days}d` : `${days}d ${remHours}h`;
  return `${duration} ago`;
};

// Helper function to format a relative time string.
export const getRelativeTimeString = (
  date: string | Date | undefined
): string => {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  // "min", never "mins" or "minutes" - the same unit this file's
  // formatDataAge and the forecast summary use, so the freshness caption in
  // the app bar reads the same as the one under the graphs.
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24)
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
};

// Current time in Europe/London as "HH:MM", regardless of the runtime's local timezone.
export const getLondonHHMM = (date: Date = new Date()): string =>
  date.toLocaleTimeString("en-GB", {
    timeZone: "Europe/London",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

// Current hour (0-23) in Europe/London, regardless of the runtime's local timezone.
export const getLondonHour = (date: Date = new Date()): number =>
  parseInt(
    date.toLocaleTimeString("en-GB", {
      timeZone: "Europe/London",
      hour12: false,
      hour: "2-digit",
    }),
    10
  );

// Extracts "HH:MM" from an ISO timestamp string, e.g. for sunrise/sunset fields.
export const hhmmOfISO = (iso: string): string | null =>
  iso.split("T")[1]?.slice(0, 5) ?? null;

// Minutes past midnight of an ISO "YYYY-MM-DDTHH:MM" time.
export const minutesOfISO = (iso: string | null): number | null => {
  const hhmm = iso ? hhmmOfISO(iso) : null;
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const hourOfISO = (iso: string | null): number | null => {
  const hhmm = iso ? hhmmOfISO(iso) : null;
  return hhmm ? parseInt(hhmm.slice(0, 2), 10) : null;
};

const clampToHour = (minutes: number) => Math.min(Math.max(minutes, 0), 60);

// Whether the forecast hour starting at hour:00 counts as dark: more than
// THRESHOLDS.DARK_HOUR_FRACTION of it is before sunrise or after sunset.
// With sunset at 18:40 the 18:00 hour is 20 minutes dark, so it's dark; at
// 18:50 it's 10 minutes dark, so it isn't. Sunrise/sunset are the local
// "YYYY-MM-DDTHH:MM" strings Open-Meteo returns for Europe/London.
export const isDarkHour = (
  hour: number,
  sunrise: string | null,
  sunset: string | null
): boolean => {
  const start = hour * 60;
  const sunriseMinutes = minutesOfISO(sunrise);
  const sunsetMinutes = minutesOfISO(sunset);
  const darkMinutes =
    (sunriseMinutes !== null ? clampToHour(sunriseMinutes - start) : 0) +
    (sunsetMinutes !== null ? clampToHour(start + 60 - sunsetMinutes) : 0);
  return darkMinutes > 60 * THRESHOLDS.DARK_HOUR_FRACTION;
};

// 70 -> "1 h 10 min", 60 -> "1 h", 10 -> "10 min".
export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

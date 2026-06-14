import { DayForecast, Status } from "@/types";

const isDarkOnly = (reasons: string[]) =>
  reasons.length === 1 && reasons[0] === "Dark";

const slotAtHour = (graphData: DayForecast["graphData"], hour: number) =>
  graphData.find((pt) => pt.time === `${String(hour).padStart(2, "0")}:00`);

const hhmm = (iso: string) => iso.split("T")[1]?.slice(0, 5) ?? null;

export function buildBestPaddlingTimes(todayForecast: DayForecast | null): string | null {
  if (!todayForecast) return null;

  const now = new Date();
  const currentHH = `${String(now.getHours()).padStart(2, "0")}:00`;

  const futureSlots = todayForecast.graphData.filter(
    (pt) => pt.time >= currentHH && !pt.reasons.includes("Dark")
  );
  if (futureSlots.length === 0) return null;

  const preferredStatuses: Status[] = ["Light Green", "Dark Green"];
  let bestStatus: Status | null = null;
  for (const s of preferredStatuses) {
    if (futureSlots.some((pt) => pt.status === s)) {
      bestStatus = s;
      break;
    }
  }
  if (!bestStatus) return null;

  const windows: { start: string; end: string }[] = [];
  let windowStart: string | null = null;
  let lastTime: string | null = null;

  for (const pt of futureSlots) {
    if (pt.status === bestStatus) {
      if (windowStart === null) windowStart = pt.time;
      lastTime = pt.time;
    } else {
      if (windowStart !== null && lastTime !== null) {
        windows.push({ start: windowStart, end: lastTime });
        windowStart = null;
        lastTime = null;
      }
    }
  }
  if (windowStart !== null && lastTime !== null) {
    windows.push({ start: windowStart, end: lastTime });
  }

  if (windows.length === 0) return null;

  const { graphData, sunrise, sunset } = todayForecast;
  const sunriseHHMM = sunrise ? hhmm(sunrise) : null;
  const sunsetHHMM = sunset ? hhmm(sunset) : null;

  const label = bestStatus === "Light Green" ? "light green" : "dark green";
  const ranges = windows
    .map((w, i) => {
      // Start: use "now" for current hour, or sunrise if the preceding slot was dark-only
      let start: string;
      if (i === 0 && w.start === currentHH) {
        start = "now";
      } else {
        const startHour = parseInt(w.start.split(":")[0], 10);
        const prevSlot = slotAtHour(graphData, startHour - 1);
        start =
          sunriseHHMM && prevSlot && isDarkOnly(prevSlot.reasons)
            ? sunriseHHMM
            : w.start;
      }

      // End: extend to sunset if the slot immediately after is dark-only
      const endHour = parseInt(w.end.split(":")[0], 10);
      const nextSlot = slotAtHour(graphData, endHour + 1);
      const end =
        sunsetHHMM && nextSlot && isDarkOnly(nextSlot.reasons)
          ? sunsetHHMM
          : `${String((endHour + 1) % 24).padStart(2, "0")}:00`;

      return `${start}–${end}`;
    })
    .join(", ");

  return `Best conditions today: ${ranges} (${label})`;
}

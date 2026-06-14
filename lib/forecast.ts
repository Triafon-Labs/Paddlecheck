import { DayForecast, Status } from "@/types";

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

  const label = bestStatus === "Light Green" ? "light green" : "dark green";
  const ranges = windows.map((w) => `${w.start}–${w.end}`).join(", ");
  return `Best conditions today: ${ranges} (${label})`;
}

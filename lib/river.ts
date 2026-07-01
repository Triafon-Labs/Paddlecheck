import { RiverReading, ApiResponse, ChartDataPoint } from "@/types";
import {
  API_ENDPOINTS,
  RIVER_STATION_ID,
  TIME_PERIODS,
  BEWDLEY_CSV_URL,
  BEWDLEY_TRAVEL_HOURS,
} from "@/lib/config";

export interface BewdleyForecastPoint {
  timestamp: Date;
  level: number;
}

/**
 * Fetches the upstream Bewdley river level forecast and observations.
 * The forecast is limited to 24 hours ahead from the current time.
 */
export const fetchBewdleyForecast = async (): Promise<{
  forecasts: BewdleyForecastPoint[];
  observations: BewdleyForecastPoint[];
  currentLevel: number | null;
}> => {
  const response = await fetch(BEWDLEY_CSV_URL);
  if (!response.ok)
    throw new Error(`Bewdley CSV fetch failed: ${response.status}`);
  const text = await response.text();
  const lines = text.trim().split("\n");

  const forecasts: BewdleyForecastPoint[] = [];
  const observations: BewdleyForecastPoint[] = [];

  const now = new Date();
  const twentyFourHoursAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Skip header row (index 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(",");
    if (parts.length < 3) continue;

    // Normalise timestamp: replace space with T and append Z if no timezone given
    let tsStr = parts[0].trim().replace(" ", "T");
    if (!tsStr.endsWith("Z") && !tsStr.includes("+")) tsStr += "Z";
    const timestamp = new Date(tsStr);
    const level = parseFloat(parts[1].trim());
    const type = parts[2].trim().toLowerCase();

    if (isNaN(level) || isNaN(timestamp.getTime())) continue;

    if (type === "forecast") {
      // Only retrieve up to 24 hours ahead
      if (timestamp <= twentyFourHoursAhead) {
        forecasts.push({ timestamp, level });
      }
    } else if (type === "observed") {
      observations.push({ timestamp, level });
    }
  }

  // Current level = latest observed reading
  const latestObserved = observations.reduce<BewdleyForecastPoint | null>(
    (latest, pt) => (!latest || pt.timestamp > latest.timestamp ? pt : latest),
    null
  );

  return {
    forecasts,
    observations,
    currentLevel: latestObserved?.level ?? null,
  };
};

// Apply a delta-transfer from Bewdley's data to forecast Worcester's level.
// Worcester's current level already reflects what Bewdley was doing 6 hours
// ago, so the reference baseline is Bewdley at (now – 6h), not Bewdley now.
// delta = bewdley(targetWorcesterTime - 6h) – bewdley(now – 6h)
// worcesterForecasted = worcesterCurrentLevel + delta
export const getBewdleyBasedWorcesterLevel = (
  worcesterCurrentLevel: number,
  bewdleyForecasts: BewdleyForecastPoint[],
  bewdleyObservations: BewdleyForecastPoint[],
  targetWorcesterTime: Date,
  now: Date
): number | null => {
  const allPoints = [...bewdleyObservations, ...bewdleyForecasts];
  if (!allPoints.length) return null;

  const findClosest = (target: Date): BewdleyForecastPoint | null => {
    let closest: BewdleyForecastPoint | null = null;
    let minDiff = Infinity;
    for (const pt of allPoints) {
      const diff = Math.abs(pt.timestamp.getTime() - target.getTime());
      if (diff < minDiff) { minDiff = diff; closest = pt; }
    }
    return closest && minDiff <= 45 * 60 * 1000 ? closest : null;
  };

  // Baseline: what Bewdley was reading 6h ago (already baked into Worcester's current level)
  const baselineBewdleyTime = new Date(now.getTime() - BEWDLEY_TRAVEL_HOURS * 3600 * 1000);
  const baseline = findClosest(baselineBewdleyTime);
  if (!baseline) return null;

  // Target: what Bewdley was/is/will be at (targetWorcesterTime – 6h)
  const targetBewdleyTime = new Date(targetWorcesterTime.getTime() - BEWDLEY_TRAVEL_HOURS * 3600 * 1000);
  const target = findClosest(targetBewdleyTime);
  if (!target) return null;

  const delta = target.level - baseline.level;
  return Math.max(0, worcesterCurrentLevel + delta);
};

export const fetchRiverData = async (
  stationId: string = RIVER_STATION_ID,
  days: number = 1
) => {
  const sinceDate = new Date(
    new Date().getTime() - days * TIME_PERIODS.TWENTY_FOUR_HOURS
  ).toISOString();
  const response = await fetch(
    `${API_ENDPOINTS.RIVER}/${stationId}/readings?since=${sinceDate}`
  );
  if (!response.ok)
    throw new Error(`River API fetch failed: ${response.status}`);
  const result: ApiResponse = await response.json();
  const sortedItems = result.items.sort(
    (a: RiverReading, b: RiverReading) =>
      new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  );

  const formattedData: ChartDataPoint[] = sortedItems.map(
    (item: RiverReading) => ({
      dateTime: item.dateTime,
      level: item.value,
    })
  );

  let latestLevel: number | null = null;
  let change1h: number | null = null;
  let change24h: number | null = null;
  let change8h: number | null = null;
  let change5d: number | null = null;

  if (sortedItems.length > 1) {
    latestLevel = sortedItems[sortedItems.length - 1].value;
    const oldestLevel5d = sortedItems[0].value;
    change5d = latestLevel - oldestLevel5d;

    const now = new Date().getTime();
    const oneHourAgo = new Date(now - TIME_PERIODS.ONE_HOUR);
    const oneHourIndex = sortedItems.findIndex(
      (item: RiverReading) => new Date(item.dateTime) >= oneHourAgo
    );
    if (oneHourIndex !== -1) {
      const oldestLevel1h = sortedItems[oneHourIndex].value;
      change1h = latestLevel - oldestLevel1h;
    }

    const twentyFourHoursAgo = new Date(now - TIME_PERIODS.TWENTY_FOUR_HOURS);
    const twentyFourHourIndex = sortedItems.findIndex(
      (item: RiverReading) => new Date(item.dateTime) >= twentyFourHoursAgo
    );
    if (twentyFourHourIndex !== -1) {
      const oldestLevel24h = sortedItems[twentyFourHourIndex].value;
      change24h = latestLevel - oldestLevel24h;
    }

    const eightHoursAgo = new Date(now - TIME_PERIODS.EIGHT_HOURS);
    const eightHourIndex = sortedItems.findIndex(
      (item: RiverReading) => new Date(item.dateTime) >= eightHoursAgo
    );
    if (eightHourIndex !== -1) {
      const oldestLevel8h = sortedItems[eightHourIndex].value;
      change8h = latestLevel - oldestLevel8h;
    }
  }

  return {
    latestLevel,
    change1h,
    change24h,
    change8h,
    change5d,
    historicalData: formattedData,
  };
};

export const forecastRiverLevel = (
  latestLevel: number,
  historicalData: ChartDataPoint[],
  hoursInFuture: number
): number => {
  // 1. Filter data for the last 8 hours
  const eightHoursAgo = new Date().getTime() - TIME_PERIODS.EIGHT_HOURS;
  const recentData = historicalData.filter(
    (d) => new Date(d.dateTime).getTime() >= eightHoursAgo
  );

  // 2. Check if there's enough data to calculate a trend
  if (recentData.length < 2) {
    // Fallback: no trend can be calculated, return the latest level
    return latestLevel;
  }

  // 3. Prepare data for linear regression
  const firstTimestamp = new Date(recentData[0].dateTime).getTime() / 1000; // in seconds
  const x = recentData.map(
    (d) => new Date(d.dateTime).getTime() / 1000 - firstTimestamp
  );
  const y = recentData.map((d) => d.level);
  const n = recentData.length;

  // 4. Calculate sums for linear regression
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
  }

  // 5. Calculate slope (trend)
  const numerator = n * sumXY - sumX * sumY;
  const denominator = n * sumX2 - sumX * sumX;

  // Avoid division by zero if all x values are the same (shouldn't happen with timestamps)
  if (denominator === 0) {
    return latestLevel;
  }

  const slope = numerator / denominator; // level change per second

  // 6. Predict future level
  const slopePerHour = slope * 3600; // convert from seconds to hours
  const forecastedLevel = latestLevel + slopePerHour * hoursInFuture;

  // 7. Ensure forecast doesn't go below a sensible minimum (e.g., 0)
  return Math.max(0, forecastedLevel);
};

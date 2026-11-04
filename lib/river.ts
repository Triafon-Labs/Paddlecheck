import { RiverReading, ApiResponse, ChartDataPoint } from "@/types";
import {
  API_ENDPOINTS,
  RIVER_STATION_ID,
  TIME_PERIODS,
  UPSTREAM_CSV_URL,
  UPSTREAM_TRAVEL_HOURS,
  UPSTREAM_TREND_HOURS,
} from "@/lib/config";
import { FetchLiveness, fetchCacheOptions } from "@/lib/fetchCache";

export interface UpstreamForecastPoint {
  timestamp: Date;
  level: number;
}

/**
 * Fetches the upstream river level forecast and observations.
 * The whole published forecast is kept – its length varies (24–36 h has been
 * seen), so the feed decides how far ahead the upstream-based forecast reaches.
 */
export const fetchUpstreamForecast = async (
  liveness: FetchLiveness = {}
): Promise<{
  forecasts: UpstreamForecastPoint[];
  observations: UpstreamForecastPoint[];
  currentLevel: number | null;
}> => {
  // No upstream station configured: an empty forecast, which the client
  // treats the same as a failed fetch and falls back to the linear trend.
  if (!UPSTREAM_CSV_URL)
    return { forecasts: [], observations: [], currentLevel: null };
  const response = await fetch(UPSTREAM_CSV_URL, fetchCacheOptions(liveness));
  if (!response.ok)
    throw new Error(`Upstream CSV fetch failed: ${response.status}`);
  const text = await response.text();
  const lines = text.trim().split("\n");

  const forecasts: UpstreamForecastPoint[] = [];
  const observations: UpstreamForecastPoint[] = [];

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
      forecasts.push({ timestamp, level });
    } else if (type === "observed") {
      observations.push({ timestamp, level });
    }
  }

  // Current level = latest observed reading
  const latestObserved = observations.reduce<UpstreamForecastPoint | null>(
    (latest, pt) => (!latest || pt.timestamp > latest.timestamp ? pt : latest),
    null
  );

  return {
    forecasts,
    observations,
    currentLevel: latestObserved?.level ?? null,
  };
};

// Apply a delta-transfer from the upstream gauge's data to forecast the club gauge's level.
// The club gauge's latest reading already reflects what the upstream gauge was doing 6 hours
// before it was taken, so that is the baseline – anchored to the reading's own
// timestamp, not "now", so the forecast starts exactly on the last reading
// instead of jumping by however much the upstream gauge moved while the feed lagged.
// delta = upstream(targetClubTime - 6h) – upstream(clubReadingTime - 6h)
// clubForecasted = clubCurrentLevel + delta
export const getUpstreamBasedClubLevel = (
  clubCurrentLevel: number,
  upstreamForecasts: UpstreamForecastPoint[],
  upstreamObservations: UpstreamForecastPoint[],
  targetClubTime: Date,
  clubReadingTime: Date
): number | null => {
  const series = buildUpstreamSeries(upstreamObservations, upstreamForecasts);
  const lagMs = UPSTREAM_TRAVEL_HOURS * TIME_PERIODS.ONE_HOUR;

  const baseline = interpolateLevel(series, clubReadingTime.getTime() - lagMs);
  const target = interpolateLevel(series, targetClubTime.getTime() - lagMs);
  if (baseline === null || target === null) return null;

  return Math.max(0, clubCurrentLevel + (target - baseline));
};

// The upstream gauge's trend (m/h) over the last UPSTREAM_TREND_HOURS of its series, so
// the linear fallback carries on where the upstream forecast ends rather than
// from the club gauge's own recent readings – on a rise those lag the upstream gauge by the
// travel time and are still flat when the upstream data runs out.
export const getUpstreamEndSlope = (
  upstreamForecasts: UpstreamForecastPoint[],
  upstreamObservations: UpstreamForecastPoint[]
): number | null => {
  const series = buildUpstreamSeries(upstreamObservations, upstreamForecasts);
  const end = series[series.length - 1];
  if (!end) return null;
  const endMs = end.timestamp.getTime();
  const start = interpolateLevel(
    series,
    endMs - UPSTREAM_TREND_HOURS * TIME_PERIODS.ONE_HOUR
  );
  if (start === null) return null;
  return (end.level - start) / UPSTREAM_TREND_HOURS;
};

// One time-ordered upstream series: observations up to the latest one, then the
// published forecast after it. The forecast was issued some time ago and rarely
// starts on the latest observation, so it is shifted to start there – otherwise
// the gap between the two shows up as a step in the club gauge's forecast.
const buildUpstreamSeries = (
  observations: UpstreamForecastPoint[],
  forecasts: UpstreamForecastPoint[]
): UpstreamForecastPoint[] => {
  const observed = [...observations].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  const forecast = [...forecasts].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  const latest = observed[observed.length - 1];
  if (!latest) return forecast;

  const latestMs = latest.timestamp.getTime();
  const forecastAtLatest = interpolateLevel(forecast, latestMs);
  const offset =
    forecastAtLatest === null ? 0 : latest.level - forecastAtLatest;
  const future = forecast
    .filter((pt) => pt.timestamp.getTime() > latestMs)
    .map((pt) => ({ timestamp: pt.timestamp, level: pt.level + offset }));

  return [...observed, ...future];
};

// Linearly interpolates a time-ordered series at `ms`. Null outside the series,
// or across a gap wider than UPSTREAM_MAX_GAP_MS (missing data, not a trend).
const UPSTREAM_MAX_GAP_MS = 3 * TIME_PERIODS.ONE_HOUR;
const interpolateLevel = (
  series: UpstreamForecastPoint[],
  ms: number
): number | null => {
  for (let i = 0; i < series.length; i++) {
    const b = series[i];
    const bMs = b.timestamp.getTime();
    if (bMs === ms) return b.level;
    if (bMs < ms) continue;
    if (i === 0) return null;
    const a = series[i - 1];
    const aMs = a.timestamp.getTime();
    if (bMs - aMs > UPSTREAM_MAX_GAP_MS) return null;
    return a.level + ((b.level - a.level) * (ms - aMs)) / (bMs - aMs);
  }
  return null;
};

export const fetchRiverData = async (
  stationId: string = RIVER_STATION_ID,
  days: number = 1,
  liveness: FetchLiveness = {}
) => {
  const sinceDate = new Date(
    new Date().getTime() - days * TIME_PERIODS.TWENTY_FOUR_HOURS
  ).toISOString();
  const response = await fetch(
    `${API_ENDPOINTS.RIVER}/${stationId}/readings?since=${sinceDate}`,
    fetchCacheOptions(liveness)
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

    // Measure each window back from the latest reading, not from now: the
    // feed often lags by up to an hour, and a "now"-anchored 1h window would
    // then hold only the latest reading and always read 0.00 m.
    const latestTime = new Date(
      sortedItems[sortedItems.length - 1].dateTime
    ).getTime();
    const oneHourAgo = new Date(latestTime - TIME_PERIODS.ONE_HOUR);
    const oneHourIndex = sortedItems.findIndex(
      (item: RiverReading) => new Date(item.dateTime) >= oneHourAgo
    );
    if (oneHourIndex !== -1) {
      const oldestLevel1h = sortedItems[oneHourIndex].value;
      change1h = latestLevel - oldestLevel1h;
    }

    const twentyFourHoursAgo = new Date(
      latestTime - TIME_PERIODS.TWENTY_FOUR_HOURS
    );
    const twentyFourHourIndex = sortedItems.findIndex(
      (item: RiverReading) => new Date(item.dateTime) >= twentyFourHoursAgo
    );
    if (twentyFourHourIndex !== -1) {
      const oldestLevel24h = sortedItems[twentyFourHourIndex].value;
      change24h = latestLevel - oldestLevel24h;
    }

    const eightHoursAgo = new Date(latestTime - TIME_PERIODS.EIGHT_HOURS);
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

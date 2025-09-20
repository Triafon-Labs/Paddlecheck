import { RiverReading, ApiResponse, ChartDataPoint } from "@/types";

export const fetchRiverData = async (stationId: string = "2642", days: number = 1) => {
  const sinceDate = new Date(
    new Date().getTime() - days * 24 * 60 * 60 * 1000
  ).toISOString();
  const response = await fetch(
    `https://environment.data.gov.uk/flood-monitoring/id/stations/${stationId}/readings?since=${sinceDate}`
  );
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

    const oneHourAgo = new Date(new Date().getTime() - 1 * 60 * 60 * 1000);
    const oneHourIndex = sortedItems.findIndex(
      (item: RiverReading) => new Date(item.dateTime) >= oneHourAgo
    );
    if (oneHourIndex !== -1) {
      const oldestLevel1h = sortedItems[oneHourIndex].value;
      change1h = latestLevel - oldestLevel1h;
    }

    const twentyFourHoursAgo = new Date(
      new Date().getTime() - 24 * 60 * 60 * 1000
    );
    const twentyFourHourIndex = sortedItems.findIndex(
      (item: RiverReading) => new Date(item.dateTime) >= twentyFourHoursAgo
    );
    if (twentyFourHourIndex !== -1) {
      const oldestLevel24h = sortedItems[twentyFourHourIndex].value;
      change24h = latestLevel - oldestLevel24h;
    }

    const eightHoursAgo = new Date(
      new Date().getTime() - 8 * 60 * 60 * 1000
    );
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

export const predictRiverLevel = (
  latestLevel: number,
  historicalData: ChartDataPoint[],
  hoursInFuture: number
): number => {
  // 1. Filter data for the last 8 hours
  const eightHoursAgo = new Date().getTime() - 8 * 60 * 60 * 1000;
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
  const predictedLevel = latestLevel + slopePerHour * hoursInFuture;

  // 7. Ensure prediction doesn't go below a sensible minimum (e.g., 0)
  return Math.max(0, predictedLevel);
};

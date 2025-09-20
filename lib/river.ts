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
  change1h: number,
  change8h: number,
  hoursInFuture: number
): number => {
  // Use the average velocity over the last 8 hours for a more stable prediction.
  const averageVelocity8h = change8h / 8;

  // Simple linear extrapolation: level = initial_level + velocity * time
  const predictedLevel = latestLevel + averageVelocity8h * hoursInFuture;

  // Ensure prediction doesn't go below a sensible minimum (e.g., 0)
  return Math.max(0, predictedLevel);
};

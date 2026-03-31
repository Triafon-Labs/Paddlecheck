import { useState, useEffect, useCallback } from "react";
import {
  KayakConditions,
  ChartDataPoint,
  DayForecast,
} from "@/types";
import {
  calculateFinalRagStatus,
  findLevelDescription,
  calculateInitialRagStatus,
  RAG_STATUS_MAP,
  ragHeight,
} from "@/lib/rag";
import {
  fetchRiverData,
  predictRiverLevel,
  fetchBewdleyForecast,
  getBewdleyBasedWorcesterLevel,
} from "@/lib/river";
import {
  fetchWeatherData,
  getVisibilityDescription,
  fetchFutureWeatherData,
} from "@/lib/weather";
import {
  RIVER_STATION_ID,
  LATITUDE,
  LONGITUDE,
  HISTORICAL_DAYS,
  getPitchcroftPaddleability,
} from "@/lib/config";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const useKayakData = () => {
  const [conditions, setConditions] = useState<KayakConditions | null>(null);
  const [forecastDays, setForecastDays] = useState<DayForecast[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [predictLoading, setPredictLoading] = useState(true);
  const [riverGraphData, setRiverGraphData] = useState<ChartDataPoint[] | null>(
    null
  );
  const [riverChange1h, setRiverChange1h] = useState<number | null>(null);
  const [riverChange24h, setRiverChange24h] = useState<number | null>(null);
  const [riverChange8h, setRiverChange8h] = useState<number | null>(null);
  const [riverChange5d, setRiverChange5d] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setPredictLoading(true);

      // Fetch all data concurrently; Bewdley failure is non-fatal
      const [riverData, weatherData, futureWeatherData, bewdleyData] =
        await Promise.all([
          fetchRiverData(RIVER_STATION_ID, HISTORICAL_DAYS),
          fetchWeatherData(LATITUDE, LONGITUDE),
          fetchFutureWeatherData(LATITUDE, LONGITUDE),
          fetchBewdleyForecast().catch(() => ({
            forecasts: [],
            currentLevel: null,
          })),
        ]);

      // Process current conditions
      setRiverGraphData(riverData.historicalData);
      setRiverChange1h(riverData.change1h);
      setRiverChange24h(riverData.change24h);
      setRiverChange8h(riverData.change8h);
      setRiverChange5d(riverData.change5d);

      const currentConditions: Partial<KayakConditions> = {
        riverLevel:
          riverData.latestLevel === null ? undefined : riverData.latestLevel,
        temperature: weatherData.temperature,
        windSpeed: weatherData.windSpeed,
        windDirection: weatherData.windDirection,
        rain: weatherData.rain,
        dark: weatherData.dark,
        visibility: weatherData.visibility,
        weatherCode: weatherData.weatherCode,
      };

      const initialRagNumber = calculateInitialRagStatus(
        currentConditions.riverLevel || 0
      );
      const initialStatus = RAG_STATUS_MAP[initialRagNumber];
      const { status, reasons } = calculateFinalRagStatus(currentConditions);
      const visibilityDescription = getVisibilityDescription(
        currentConditions.visibility || 0
      );
      const pitchcroftPaddleability = getPitchcroftPaddleability(
        currentConditions.riverLevel || 0
      );

      setConditions({
        ...currentConditions,
        initialStatus,
        overallStatus: status,
        reasons: reasons,
        levelChange: {
          value: riverData.change8h || 0,
          period: "8h",
        },
        launchMessage: findLevelDescription(riverData.latestLevel || 0),
        lastUpdated: new Date().toISOString(),
        visibilityDescription,
        pitchcroftPaddleability,
      });
      setLoading(false);

      // Build 5-day forecast (today + 4 days ahead)
      const now = new Date();
      const currentHour = now.getHours();
      const days: DayForecast[] = [];

      // Pre-compute Worcester's linear trend slope (m/h) once so the fallback
      // after the Bewdley window can continue smoothly from wherever Bewdley
      // left off, rather than jumping back to the current level.
      const worcesterSlopePerHour =
        predictRiverLevel(riverData.latestLevel || 0, riverData.historicalData, 1) -
        (riverData.latestLevel || 0);

      // Tracks the last Bewdley-based prediction level and the hoursAhead at
      // which the Bewdley data ran out, so linear regression is anchored there.
      let lastBewdleyPrediction: number | null = null;
      let transitionHoursAhead: number | null = null;

      for (let d = 0; d < 5; d++) {
        const dayStartIndex = d * 24;
        const sunrise = futureWeatherData.daily.sunrise[d] ?? null;
        const sunset = futureWeatherData.daily.sunset[d] ?? null;
        const sunriseHour = sunrise
          ? parseInt(sunrise.split("T")[1].split(":")[0], 10)
          : null;
        const sunsetHour = sunset
          ? parseInt(sunset.split("T")[1].split(":")[0], 10)
          : null;

        const hourStart = d === 0 ? currentHour : 0;
        const graphData = [];

        for (let h = hourStart; h < 24; h++) {
          const index = dayStartIndex + h;
          if (index >= futureWeatherData.hourly.time.length) break;

          // Hours ahead from now for river level prediction
          const hoursAhead = d * 24 + h - currentHour + 1;
          const targetWorcesterTime = new Date(
            now.getTime() + hoursAhead * 3600 * 1000
          );

          // TEST MOCK — remove before merging
          // Simulates a peak (~4m) around hour 15 then a trough (~0.3m) around hour 45
          const MOCK_PEAK_TROUGH = true;
          if (MOCK_PEAK_TROUGH) {
            const base = riverData.latestLevel || 0;
            const mockLevel = base + 3.5 * Math.sin((hoursAhead / 60) * 2 * Math.PI);
            graphData.push({
              time: `${h}:00`,
              status: calculateFinalRagStatus({ riverLevel: Math.max(0, mockLevel), temperature: futureWeatherData.hourly.temperature_2m[index], windSpeed: futureWeatherData.hourly.wind_speed_10m[index], rain: futureWeatherData.hourly.precipitation[index] > 0, dark: !futureWeatherData.hourly.is_day[index], visibility: futureWeatherData.hourly.visibility[index], weatherCode: futureWeatherData.hourly.weather_code[index] }).status,
              reasons: calculateFinalRagStatus({ riverLevel: Math.max(0, mockLevel) }).reasons,
              value: ragHeight[calculateFinalRagStatus({ riverLevel: Math.max(0, mockLevel) }).status] || 0.1,
              predictedLevel: Math.max(0, mockLevel),
              predictionSource: (hoursAhead <= 30 ? "bewdley" : "linear") as "bewdley" | "linear",
            });
            continue;
          }
          // END TEST MOCK

          const bewdleyLevel =
            bewdleyData.currentLevel !== null
              ? getBewdleyBasedWorcesterLevel(
                  riverData.latestLevel || 0,
                  bewdleyData.forecasts,
                  bewdleyData.observations,
                  targetWorcesterTime,
                  now
                )
              : null;

          const predictionSource: "bewdley" | "linear" =
            bewdleyLevel !== null ? "bewdley" : "linear";

          let predictedRiverLevel: number;
          if (bewdleyLevel !== null) {
            predictedRiverLevel = bewdleyLevel;
            lastBewdleyPrediction = bewdleyLevel;
            transitionHoursAhead = hoursAhead;
          } else {
            // Anchor linear regression to the last Bewdley-predicted level so
            // there's no jump at the transition point.
            const baseLevel = lastBewdleyPrediction ?? (riverData.latestLevel || 0);
            const baseHours = transitionHoursAhead ?? 0;
            predictedRiverLevel = Math.max(
              0,
              baseLevel + worcesterSlopePerHour * (hoursAhead - baseHours)
            );
          }

          let dark;
          if (sunriseHour !== null && sunsetHour !== null) {
            dark = h < sunriseHour || h >= sunsetHour;
          } else {
            dark = !futureWeatherData.hourly.is_day[index];
          }

          const predictedConditions: Partial<KayakConditions> = {
            riverLevel: predictedRiverLevel,
            temperature: futureWeatherData.hourly.temperature_2m[index],
            windSpeed: futureWeatherData.hourly.wind_speed_10m[index],
            rain: futureWeatherData.hourly.precipitation[index] > 0,
            dark,
            visibility: futureWeatherData.hourly.visibility[index],
            weatherCode: futureWeatherData.hourly.weather_code[index],
          };

          const { status: predictedStatus, reasons: predictedReasons } =
            calculateFinalRagStatus(predictedConditions);

          graphData.push({
            time: `${h}:00`,
            status: predictedStatus,
            reasons: predictedReasons,
            value: ragHeight[predictedStatus] || 0.1,
            predictedLevel: predictedRiverLevel,
            predictionSource,
          });
        }

        const dayDateStr =
          futureWeatherData.hourly.time[dayStartIndex].split("T")[0];
        // Use noon to avoid timezone offset issues when parsing date-only strings
        const dateObj = new Date(`${dayDateStr}T12:00:00`);
        const label =
          d === 0
            ? "Today"
            : `${DAY_NAMES[dateObj.getDay()]} ${dateObj.getDate()}`;

        days.push({ date: dayDateStr, label, graphData, sunrise, sunset });
      }

      setForecastDays(days);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
      setPredictLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    conditions,
    forecastDays,
    loading,
    predictLoading,
    riverGraphData,
    riverChange1h,
    riverChange24h,
    riverChange8h,
    riverChange5d,
    refetch: fetchData,
  };
};

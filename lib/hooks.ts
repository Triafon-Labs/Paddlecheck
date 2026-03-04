import { useState, useEffect, useCallback } from "react";
import {
  KayakConditions,
  ChartDataPoint,
  PredictedGraphDataPoint,
} from "@/types";
import {
  calculateFinalRagStatus,
  findLevelDescription,
  calculateInitialRagStatus,
  RAG_STATUS_MAP,
  ragHeight,
} from "@/lib/rag";
import { fetchRiverData, predictRiverLevel } from "@/lib/river";
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

export const useKayakData = () => {
  const [conditions, setConditions] = useState<KayakConditions | null>(null);
  const [predictedGraphData, setPredictedGraphData] = useState<
    PredictedGraphDataPoint[] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [predictLoading, setPredictLoading] = useState(true);
  const [riverGraphData, setRiverGraphData] = useState<ChartDataPoint[] | null>(
    null
  );
  const [riverChange1h, setRiverChange1h] = useState<number | null>(null);
  const [riverChange24h, setRiverChange24h] = useState<number | null>(null);
  const [riverChange8h, setRiverChange8h] = useState<number | null>(null);
  const [riverChange5d, setRiverChange5d] = useState<number | null>(null);
  const [sunrise, setSunrise] = useState<string | null>(null);
  const [sunset, setSunset] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setPredictLoading(true);

      // Fetch all data concurrently
      const [riverData, weatherData, futureWeatherData] = await Promise.all([
        fetchRiverData(RIVER_STATION_ID, HISTORICAL_DAYS),
        fetchWeatherData(LATITUDE, LONGITUDE),
        fetchFutureWeatherData(LATITUDE, LONGITUDE),
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

      // Process predicted data
      setSunrise(futureWeatherData.daily.sunrise[0]);
      setSunset(futureWeatherData.daily.sunset[0]);

      const graphData: PredictedGraphDataPoint[] = [];
      const now = new Date();
      const currentHour = now.getHours();

      const startIndex = futureWeatherData.hourly.time.findIndex((t) => {
        const hour = parseInt(t.split("T")[1].split(":")[0], 10);
        return hour >= currentHour;
      });

      if (startIndex !== -1) {
        for (let i = 0; i < 24; i++) {
          const index = startIndex + i;
          if (index >= futureWeatherData.hourly.time.length) break;

          const timeStr = futureWeatherData.hourly.time[index];
          const hour = parseInt(timeStr.split("T")[1].split(":")[0], 10);

          const predictedRiverLevel = predictRiverLevel(
            riverData.latestLevel || 0,
            riverData.historicalData,
            i + 1
          );

          const sunriseHour = futureWeatherData.daily.sunrise[0]
            ? parseInt(
                futureWeatherData.daily.sunrise[0].split("T")[1].split(":")[0],
                10
              )
            : null;
          const sunsetHour = futureWeatherData.daily.sunset[0]
            ? parseInt(
                futureWeatherData.daily.sunset[0].split("T")[1].split(":")[0],
                10
              )
            : null;

          let dark;
          if (sunriseHour && sunsetHour) {
            dark = hour <= sunriseHour || hour >= sunsetHour;
          } else {
            dark = !futureWeatherData.hourly.is_day[index];
          }

          const predictedConditions: Partial<KayakConditions> = {
            riverLevel: predictedRiverLevel,
            temperature: futureWeatherData.hourly.temperature_2m[index],
            windSpeed: futureWeatherData.hourly.wind_speed_10m[index],
            rain: futureWeatherData.hourly.precipitation[index] > 0,
            dark: dark,
            visibility: futureWeatherData.hourly.visibility[index],
            weatherCode: futureWeatherData.hourly.weather_code[index],
          };

          const { status: predictedStatus, reasons: predictedReasons } =
            calculateFinalRagStatus(predictedConditions);

          graphData.push({
            time: `${hour}:00`,
            status: predictedStatus,
            reasons: predictedReasons,
            value: ragHeight[predictedStatus] || 0.1,
            predictedLevel: predictedRiverLevel,
          });
        }
      }

      setPredictedGraphData(graphData);
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
    predictedGraphData,
    loading,
    predictLoading,
    riverGraphData,
    riverChange1h,
    riverChange24h,
    riverChange8h,
    riverChange5d,
    sunrise,
    sunset,
    refetch: fetchData,
  };
};

import { useState, useEffect, useCallback, useRef } from "react";
import {
  KayakConditions,
  ChartDataPoint,
  DayForecast,
  WeatherData,
  FutureWeatherData,
} from "@/types";
import {
  calculateFinalRagStatus,
  findLevelDescription,
  calculateInitialRagStatus,
  getGustStatus,
  isRainWhileWarm,
  RAG_STATUS_MAP,
  ragHeight,
} from "@/lib/rag";
import {
  fetchRiverData,
  forecastRiverLevel,
  fetchBewdleyForecast,
  getBewdleyBasedWorcesterLevel,
} from "@/lib/river";
import {
  fetchWeatherData,
  getVisibilityDescription,
  getWeatherDescription,
  fetchFutureWeatherData,
} from "@/lib/weather";
import {
  RIVER_STATION_ID,
  LATITUDE,
  LONGITUDE,
  HISTORICAL_DAYS,
  isRainy,
  TIME_PERIODS,
} from "@/lib/config";
import { getLondonHHMM, getLondonHour, hhmmOfISO } from "@/lib/time";
import { STORAGE_KEYS } from "@/lib/storageKeys";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 2
): Promise<T> => {
  let delay = 500;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error("unreachable");
};

export const useKayakData = () => {
  const [conditions, setConditions] = useState<KayakConditions | null>(null);
  const [forecastDays, setForecastDays] = useState<DayForecast[] | null>(null);
  const [forecastData, setForecastData] = useState<ChartDataPoint[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [riverGraphData, setRiverGraphData] = useState<ChartDataPoint[] | null>(
    null
  );
  const [riverChange1h, setRiverChange1h] = useState<number | null>(null);
  const [riverChange24h, setRiverChange24h] = useState<number | null>(null);
  const [riverChange8h, setRiverChange8h] = useState<number | null>(null);
  const [riverChange5d, setRiverChange5d] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [usingCachedData, setUsingCachedData] = useState(false);
  // True for the full duration of any fetch attempt - initial, background,
  // or manual refresh - mirrored by loading/forecastLoading below.
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isOfflineRef = useRef(false);
  // Tracks whether conditions/forecast data has ever been populated, so that
  // *while offline* a fetch attempt (which can't succeed anyway) doesn't
  // spin forever over data that's already on screen - the offline banner
  // communicates it isn't live instead. This is the one exception: whenever
  // online, every fetch (initial, background, manual refresh) shows the
  // spinner and only clears it once a fresh response has actually landed,
  // so "not spinning" is always a guarantee the data just came from the
  // network, never a quietly-stale cache.
  const hasConditionsRef = useRef(false);
  const hasForecastRef = useRef(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    isOfflineRef.current = !navigator.onLine;
    const handleOnline = () => {
      setIsOffline(false);
      isOfflineRef.current = false;
    };
    const handleOffline = () => {
      setIsOffline(true);
      isOfflineRef.current = true;
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Each key is parsed independently so one corrupted entry (e.g. from an
      // older app version's schema) doesn't prevent the other, valid, cached
      // values from loading.
      const loadCached = <T,>(
        key: string,
        setter: (value: T) => void
      ): boolean => {
        const raw = localStorage.getItem(key);
        if (!raw) return false;
        try {
          setter(JSON.parse(raw));
          return true;
        } catch (e) {
          console.error(`Failed to parse cached "${key}":`, e);
          return false;
        }
      };

      const hasCachedConditions = loadCached(
        STORAGE_KEYS.CONDITIONS,
        setConditions
      );
      if (hasCachedConditions) hasConditionsRef.current = true;
      const hasCachedForecast = loadCached(
        STORAGE_KEYS.FORECAST_DAYS,
        setForecastDays
      );
      loadCached(STORAGE_KEYS.FORECAST_DATA, setForecastData);
      loadCached(STORAGE_KEYS.RIVER_GRAPH_DATA, setRiverGraphData);
      loadCached(STORAGE_KEYS.RIVER_CHANGE_1H, setRiverChange1h);
      loadCached(STORAGE_KEYS.RIVER_CHANGE_24H, setRiverChange24h);
      loadCached(STORAGE_KEYS.RIVER_CHANGE_8H, setRiverChange8h);
      loadCached(STORAGE_KEYS.RIVER_CHANGE_5D, setRiverChange5d);
      if (hasCachedForecast) hasForecastRef.current = true;

      // The offline exception: with no network to wait on, show the cache
      // immediately (the offline banner elsewhere makes clear it isn't
      // live) instead of spinning forever. This runs after the offline
      // effect above, which has already set isOfflineRef synchronously.
      if (isOfflineRef.current) {
        if (hasCachedConditions) setLoading(false);
        if (hasCachedForecast) setForecastLoading(false);
      }
    }
  }, []);

  const fetchData = useCallback(async () => {
    let conditionsObj: KayakConditions | null = null;
    try {
      // Every online fetch shows the spinner - initial load, background
      // refetch, manual refresh - so it disappearing is always a guarantee
      // of freshly-fetched data. The only exception is offline with a cache
      // already on screen: there's no fetch that can succeed to wait on, so
      // the cache-loading effect already cleared these and this attempt
      // (which will fail) is left to fail quietly behind the offline banner.
      const skipSpinner = isOfflineRef.current && hasConditionsRef.current;
      if (!skipSpinner) {
        setLoading(true);
        setIsRefreshing(true);
      }
      if (!(isOfflineRef.current && hasForecastRef.current)) {
        setForecastLoading(true);
      }
      setError(null);

      const readRawCache = <T,>(key: string): T | null => {
        if (typeof window === "undefined") return null;
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        try {
          return JSON.parse(raw) as T;
        } catch {
          return null;
        }
      };

      // River, weather and future-weather are fetched independently so a
      // failure in one (e.g. the EA river API blipping) doesn't discard data
      // that arrived fine from the others. Each falls back to its own
      // last-known cached value rather than the whole update failing.
      // Bewdley and warnings were already isolated this way.
      const [
        riverOutcome,
        weatherOutcome,
        futureWeatherOutcome,
        bewdleyData,
        warningsData,
      ] = await Promise.all([
        withRetry(() => fetchRiverData(RIVER_STATION_ID, HISTORICAL_DAYS))
          .then((data) => ({ ok: true as const, data }))
          .catch((err) => ({ ok: false as const, err })),
        withRetry(() => fetchWeatherData(LATITUDE, LONGITUDE))
          .then((data) => ({ ok: true as const, data }))
          .catch((err) => ({ ok: false as const, err })),
        withRetry(() => fetchFutureWeatherData(LATITUDE, LONGITUDE))
          .then((data) => ({ ok: true as const, data }))
          .catch((err) => ({ ok: false as const, err })),
        withRetry(() => fetchBewdleyForecast()).catch(() => ({
          forecasts: [],
          observations: [],
          currentLevel: null,
        })),
        fetch("/api/weather/warnings")
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => []),
      ]);

      const riverData = riverOutcome.ok
        ? riverOutcome.data
        : readRawCache<Awaited<ReturnType<typeof fetchRiverData>>>(
            STORAGE_KEYS.RIVER_DATA_RAW
          );
      const weatherData = weatherOutcome.ok
        ? weatherOutcome.data
        : readRawCache<WeatherData>(STORAGE_KEYS.WEATHER_DATA_RAW);
      const futureWeatherData = futureWeatherOutcome.ok
        ? futureWeatherOutcome.data
        : readRawCache<FutureWeatherData>(STORAGE_KEYS.FUTURE_WEATHER_DATA_RAW);

      if (!riverData || !weatherData || !futureWeatherData) {
        throw new Error(
          "One or more data sources failed and no cached fallback was available"
        );
      }

      setUsingCachedData(
        !riverOutcome.ok || !weatherOutcome.ok || !futureWeatherOutcome.ok
      );

      // Process current conditions
      setRiverGraphData(riverData.historicalData);
      setRiverChange1h(riverData.change1h);
      setRiverChange24h(riverData.change24h);
      setRiverChange8h(riverData.change8h);
      setRiverChange5d(riverData.change5d);

      const todaySunrise = futureWeatherData.daily.sunrise[0] ?? null;
      const todaySunset = futureWeatherData.daily.sunset[0] ?? null;
      const currentTimeHHMM = getLondonHHMM();
      const sunriseHHMM = todaySunrise ? hhmmOfISO(todaySunrise) : null;
      const sunsetHHMM = todaySunset ? hhmmOfISO(todaySunset) : null;
      const currentDark =
        sunriseHHMM !== null && sunsetHHMM !== null
          ? currentTimeHHMM <= sunriseHHMM || currentTimeHHMM >= sunsetHHMM
          : false;

      const currentConditions: Partial<KayakConditions> = {
        riverLevel:
          riverData.latestLevel === null ? undefined : riverData.latestLevel,
        temperature: weatherData.temperature,
        windSpeed: weatherData.windSpeed,
        windGust: weatherData.windGust,
        windDirection: weatherData.windDirection,
        rain: weatherData.rain,
        dark: currentDark,
        visibility: weatherData.visibility,
        weatherCode: weatherData.weatherCode,
      };

      const initialRagNumber = calculateInitialRagStatus(
        currentConditions.riverLevel ?? 0
      );
      const initialStatus = RAG_STATUS_MAP[initialRagNumber];
      const { status, reasons } = calculateFinalRagStatus(currentConditions);
      const gustStatus = getGustStatus(currentConditions);
      const rainWhileWarm = isRainWhileWarm(currentConditions);
      const visibilityDescription = getVisibilityDescription(
        currentConditions.visibility ?? 0
      );
      const weatherDescription = getWeatherDescription(
        currentConditions.weatherCode ?? 0
      );

      conditionsObj = {
        ...currentConditions,
        initialStatus,
        overallStatus: status,
        reasons: reasons,
        gustStatus,
        rainWhileWarm,
        warnings: warningsData,
        levelChange: {
          value: riverData.change8h ?? 0,
          period: "8h",
        },
        launchMessage: findLevelDescription(riverData.latestLevel ?? 0),
        lastUpdated: new Date().toISOString(),
        visibilityDescription,
        weatherDescription,
      };
      setConditions(conditionsObj);
      setLoading(false);
      hasConditionsRef.current = true;

      // Build 5-day forecast (today + 4 days ahead)
      const currentHour = getLondonHour();
      const now = new Date();
      const days: DayForecast[] = [];
      const forecastPoints: ChartDataPoint[] = [];

      // Pre-compute Worcester's linear trend slope (m/h) once so the fallback
      // after the Bewdley window can continue smoothly from wherever Bewdley
      // left off, rather than jumping back to the current level.
      const worcesterSlopePerHour =
        forecastRiverLevel(
          riverData.latestLevel ?? 0,
          riverData.historicalData,
          1
        ) - (riverData.latestLevel ?? 0);

      // Tracks the last Bewdley-based forecast level and the hoursAhead at
      // which the Bewdley data ran out, so linear regression is anchored there.
      let lastBewdleyForecast: number | null = null;
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

        // Skip the hour we're already in - it's a mix of past and future by
        // the time it's shown, so the forecast starts from the next full hour.
        const hourStart = d === 0 ? currentHour + 1 : 0;
        const graphData = [];

        for (let h = hourStart; h < 24; h++) {
          const index = dayStartIndex + h;
          if (index >= futureWeatherData.hourly.time.length) break;

          // Hours ahead from now for river level forecast
          const hoursAhead = d * 24 + h - currentHour;
          const targetWorcesterTime = new Date(
            now.getTime() + hoursAhead * TIME_PERIODS.ONE_HOUR
          );

          const bewdleyLevel =
            bewdleyData.currentLevel !== null && hoursAhead <= 24
              ? getBewdleyBasedWorcesterLevel(
                  riverData.latestLevel ?? 0,
                  bewdleyData.forecasts,
                  bewdleyData.observations,
                  targetWorcesterTime,
                  now
                )
              : null;

          const forecastSource: "bewdley" | "linear" =
            bewdleyLevel !== null ? "bewdley" : "linear";

          let forecastRiverLevel: number;
          if (bewdleyLevel !== null) {
            forecastRiverLevel = bewdleyLevel;
            lastBewdleyForecast = bewdleyLevel;
            transitionHoursAhead = hoursAhead;
          } else {
            // Anchor linear regression to the last Bewdley-forecasted level so
            // there's no jump at the transition point.
            const baseLevel =
              lastBewdleyForecast ?? (riverData.latestLevel || 0);
            const baseHours = transitionHoursAhead ?? 0;
            forecastRiverLevel = Math.max(
              0,
              baseLevel + worcesterSlopePerHour * (hoursAhead - baseHours)
            );
          }

          const darkBeforeSunrise = sunriseHour !== null && h <= sunriseHour;
          const darkAfterSunset = sunsetHour !== null && h >= sunsetHour;
          const dark = darkBeforeSunrise || darkAfterSunset;

          const forecastConditions: Partial<KayakConditions> = {
            riverLevel: forecastRiverLevel,
            temperature: futureWeatherData.hourly.temperature_2m[index],
            windSpeed: futureWeatherData.hourly.wind_speed_10m[index],
            windGust: futureWeatherData.hourly.wind_gusts_10m[index],
            rain: isRainy(futureWeatherData.hourly.weather_code[index]),
            dark,
            visibility: futureWeatherData.hourly.visibility[index],
            weatherCode: futureWeatherData.hourly.weather_code[index],
          };

          const { status: forecastStatus, reasons: forecastReasons } =
            calculateFinalRagStatus(forecastConditions);
          const forecastGustStatus = getGustStatus(forecastConditions);
          const forecastRainWhileWarm = isRainWhileWarm(forecastConditions);

          graphData.push({
            time: `${h}:00`,
            status: forecastStatus,
            reasons: forecastReasons,
            value: ragHeight[forecastStatus] || 0.1,
            forecastLevel: forecastRiverLevel,
            forecastSource,
            temperature: futureWeatherData.hourly.temperature_2m[index],
            windSpeed: futureWeatherData.hourly.wind_speed_10m[index],
            windGust: futureWeatherData.hourly.wind_gusts_10m[index],
            gustStatus: forecastGustStatus,
            rainWhileWarm: forecastRainWhileWarm,
            weatherDescription: getWeatherDescription(
              futureWeatherData.hourly.weather_code[index]
            ),
          });

          // Only include Bewdley-backed points in the river level graph forecast
          if (forecastSource === "bewdley") {
            forecastPoints.push({
              dateTime: futureWeatherData.hourly.time[index],
              level: forecastRiverLevel,
            });
          }
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
      setForecastData(forecastPoints);
      hasForecastRef.current = true;

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            STORAGE_KEYS.CONDITIONS,
            JSON.stringify(conditionsObj)
          );
          localStorage.setItem(
            STORAGE_KEYS.FORECAST_DAYS,
            JSON.stringify(days)
          );
          localStorage.setItem(
            STORAGE_KEYS.FORECAST_DATA,
            JSON.stringify(forecastPoints)
          );
          localStorage.setItem(
            STORAGE_KEYS.RIVER_GRAPH_DATA,
            JSON.stringify(riverData.historicalData)
          );
          localStorage.setItem(
            STORAGE_KEYS.RIVER_CHANGE_1H,
            JSON.stringify(riverData.change1h)
          );
          localStorage.setItem(
            STORAGE_KEYS.RIVER_CHANGE_24H,
            JSON.stringify(riverData.change24h)
          );
          localStorage.setItem(
            STORAGE_KEYS.RIVER_CHANGE_8H,
            JSON.stringify(riverData.change8h)
          );
          localStorage.setItem(
            STORAGE_KEYS.RIVER_CHANGE_5D,
            JSON.stringify(riverData.change5d)
          );
          // Raw per-source snapshots, so a future failure in just one source
          // can fall back to that source's own last-known data.
          localStorage.setItem(
            STORAGE_KEYS.RIVER_DATA_RAW,
            JSON.stringify(riverData)
          );
          localStorage.setItem(
            STORAGE_KEYS.WEATHER_DATA_RAW,
            JSON.stringify(weatherData)
          );
          localStorage.setItem(
            STORAGE_KEYS.FUTURE_WEATHER_DATA_RAW,
            JSON.stringify(futureWeatherData)
          );
        } catch (e) {
          console.error("Failed to write cache:", e);
        }
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      const offline = isOfflineRef.current;
      const hasCache =
        typeof window !== "undefined" &&
        localStorage.getItem(STORAGE_KEYS.CONDITIONS) !== null;
      setError(
        offline
          ? hasCache
            ? null
            : "Offline – no cached data (reconnect and refresh)"
          : hasCache
            ? null
            : "Failed to load conditions. Check your connection and tap refresh to try again."
      );
      if (hasCache) setUsingCachedData(true);
    } finally {
      setLoading(false);
      setForecastLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    conditions,
    forecastDays,
    forecastData,
    loading,
    forecastLoading,
    riverGraphData,
    riverChange1h,
    riverChange24h,
    riverChange8h,
    riverChange5d,
    error,
    isOffline,
    usingCachedData,
    isRefreshing,
    refetch: fetchData,
  };
};

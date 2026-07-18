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
} from "@/lib/config";

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
  // Unlike loading/forecastLoading (which only gate the very first render),
  // this is true for the full duration of *any* fetch attempt - initial or
  // background - so the UI can signal "actively updating" without blocking
  // on it with a spinner.
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isOfflineRef = useRef(false);
  // Tracks whether conditions/forecast data has ever been populated (from cache
  // or a completed fetch), so a background refetch or manual refresh doesn't
  // flip the loading flag back on and mask perfectly good data with a spinner.
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

      if (loadCached("paddlecheck_conditions", setConditions)) {
        hasConditionsRef.current = true;
        // Cache paints synchronously here, so the initial `loading` state
        // (which defaults to true before any fetch has resolved) must be
        // cleared immediately - otherwise the spinner still covers the
        // cached data until the very first fetch finishes.
        setLoading(false);
      }
      const hasCachedForecast = loadCached(
        "paddlecheck_forecastDays",
        setForecastDays
      );
      loadCached("paddlecheck_forecastData", setForecastData);
      loadCached("paddlecheck_riverGraphData", setRiverGraphData);
      loadCached("paddlecheck_riverChange1h", setRiverChange1h);
      loadCached("paddlecheck_riverChange24h", setRiverChange24h);
      loadCached("paddlecheck_riverChange8h", setRiverChange8h);
      loadCached("paddlecheck_riverChange5d", setRiverChange5d);
      if (hasCachedForecast) {
        hasForecastRef.current = true;
        setForecastLoading(false);
      }
    }
  }, []);

  const fetchData = useCallback(async () => {
    let conditionsObj: KayakConditions | null = null;
    try {
      // Only show a blocking spinner while there is genuinely nothing to
      // display yet. Once conditions/forecast data has been populated (from
      // cache or a prior fetch), background refetches and manual refreshes
      // update quietly instead of flashing a spinner over good data.
      if (!hasConditionsRef.current) setLoading(true);
      if (!hasForecastRef.current) setForecastLoading(true);
      setIsRefreshing(true);
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
            "paddlecheck_riverDataRaw"
          );
      const weatherData = weatherOutcome.ok
        ? weatherOutcome.data
        : readRawCache<WeatherData>("paddlecheck_weatherDataRaw");
      const futureWeatherData = futureWeatherOutcome.ok
        ? futureWeatherOutcome.data
        : readRawCache<FutureWeatherData>("paddlecheck_futureWeatherDataRaw");

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
      const currentTimeHHMM = new Date().toLocaleTimeString("en-GB", {
        timeZone: "Europe/London",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
      const sunriseHHMM = todaySunrise
        ? (todaySunrise.split("T")[1]?.slice(0, 5) ?? null)
        : null;
      const sunsetHHMM = todaySunset
        ? (todaySunset.split("T")[1]?.slice(0, 5) ?? null)
        : null;
      const currentDark =
        sunriseHHMM !== null && sunsetHHMM !== null
          ? currentTimeHHMM <= sunriseHHMM || currentTimeHHMM >= sunsetHHMM
          : false;

      const currentConditions: Partial<KayakConditions> = {
        riverLevel:
          riverData.latestLevel === null ? undefined : riverData.latestLevel,
        temperature: weatherData.temperature,
        windSpeed: weatherData.windSpeed,
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
      const currentHour = parseInt(
        new Date().toLocaleTimeString("en-GB", {
          timeZone: "Europe/London",
          hour12: false,
          hour: "2-digit",
        }),
        10
      );
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

        const hourStart = d === 0 ? currentHour : 0;
        const graphData = [];

        for (let h = hourStart; h < 24; h++) {
          const index = dayStartIndex + h;
          if (index >= futureWeatherData.hourly.time.length) break;

          // Hours ahead from now for river level forecast
          const hoursAhead = d * 24 + h - currentHour;
          const targetWorcesterTime = new Date(
            now.getTime() + hoursAhead * 3600 * 1000
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
            rain: isRainy(futureWeatherData.hourly.weather_code[index]),
            dark,
            visibility: futureWeatherData.hourly.visibility[index],
            weatherCode: futureWeatherData.hourly.weather_code[index],
          };

          const { status: forecastStatus, reasons: forecastReasons } =
            calculateFinalRagStatus(forecastConditions);

          // The "now" point should mirror the live status shown at the top of
          // the app rather than the backward-looking hourly forecast bucket,
          // so the graph and the headline status never disagree.
          const isCurrentHour = d === 0 && h === currentHour;
          const slotStatus = isCurrentHour ? status : forecastStatus;
          const slotReasons = isCurrentHour ? reasons : forecastReasons;

          graphData.push({
            time: `${h}:00`,
            status: slotStatus,
            reasons: slotReasons,
            value: ragHeight[slotStatus] || 0.1,
            forecastLevel: isCurrentHour
              ? (riverData.latestLevel ?? forecastRiverLevel)
              : forecastRiverLevel,
            forecastSource,
            temperature: isCurrentHour
              ? weatherData.temperature
              : futureWeatherData.hourly.temperature_2m[index],
            windSpeed: isCurrentHour
              ? weatherData.windSpeed
              : futureWeatherData.hourly.wind_speed_10m[index],
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
            "paddlecheck_conditions",
            JSON.stringify(conditionsObj)
          );
          localStorage.setItem(
            "paddlecheck_forecastDays",
            JSON.stringify(days)
          );
          localStorage.setItem(
            "paddlecheck_forecastData",
            JSON.stringify(forecastPoints)
          );
          localStorage.setItem(
            "paddlecheck_riverGraphData",
            JSON.stringify(riverData.historicalData)
          );
          localStorage.setItem(
            "paddlecheck_riverChange1h",
            JSON.stringify(riverData.change1h)
          );
          localStorage.setItem(
            "paddlecheck_riverChange24h",
            JSON.stringify(riverData.change24h)
          );
          localStorage.setItem(
            "paddlecheck_riverChange8h",
            JSON.stringify(riverData.change8h)
          );
          localStorage.setItem(
            "paddlecheck_riverChange5d",
            JSON.stringify(riverData.change5d)
          );
          // Raw per-source snapshots, so a future failure in just one source
          // can fall back to that source's own last-known data.
          localStorage.setItem(
            "paddlecheck_riverDataRaw",
            JSON.stringify(riverData)
          );
          localStorage.setItem(
            "paddlecheck_weatherDataRaw",
            JSON.stringify(weatherData)
          );
          localStorage.setItem(
            "paddlecheck_futureWeatherDataRaw",
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
        localStorage.getItem("paddlecheck_conditions") !== null;
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

import { useState, useEffect, useCallback, useRef } from "react";
import {
  KayakConditions,
  ChartDataPoint,
  DayForecast,
  WeatherData,
  FutureWeatherData,
  RiverDataResult,
  ConditionsApiResponse,
} from "@/types";
import { LIVE_REFETCH_AFTER_MS } from "@/lib/config";
import { buildKayakData } from "@/lib/buildKayakData";
import { STORAGE_KEYS } from "@/lib/storageKeys";

// Exported so the UI (offline banner, error alert) can recognise this exact
// failure mode instead of string-matching a copy of the message.
export const OFFLINE_NO_CACHE_ERROR =
  "Offline – no cached data (reconnect and refresh)";

// Forecasts cached before the upstream gauge's source was renamed still say
// "bewdley"; without this, an offline open would show those hours with no
// source label or line until the next successful fetch replaced them.
const migrateForecastSource = (days: DayForecast[]): DayForecast[] =>
  days.map((day) => ({
    ...day,
    graphData: day.graphData.map((pt) =>
      (pt.forecastSource as string) === "bewdley"
        ? { ...pt, forecastSource: "upstream" }
        : pt
    ),
  }));

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
  // True for the full duration of any fetch attempt - initial, background,
  // or manual refresh - mirrored by loading/forecastLoading below.
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Whether the last fetch finished without anything inside the cache window
  // (LIVE_REFETCH_AFTER_MS) - i.e. a refresh was tried and couldn't get
  // anything newer, through the conditions API, the forced live fetch or the
  // caches. Data that only goes stale later, because nothing has fetched
  // since (there is no background poll), leaves this false. The nav bar
  // needs the difference: only the first is a failed update.
  const [lastFetchStale, setLastFetchStale] = useState(false);
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
  // When the on-screen data was actually fetched upstream (ms epoch), so the
  // focus/online listeners below can tell whether it's worth refetching.
  const lastFetchedAtRef = useRef(0);
  // Guards against overlapping fetches (e.g. regaining focus while the
  // initial load is still in flight).
  const fetchInFlightRef = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      const loadCached = <T>(
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

      const hasCachedConditions = loadCached<KayakConditions>(
        STORAGE_KEYS.CONDITIONS,
        (value) => {
          setConditions(value);
          if (value?.lastUpdated) {
            lastFetchedAtRef.current = new Date(value.lastUpdated).getTime();
          }
        }
      );
      if (hasCachedConditions) hasConditionsRef.current = true;
      const hasCachedForecast = loadCached<DayForecast[]>(
        STORAGE_KEYS.FORECAST_DAYS,
        (days) => setForecastDays(migrateForecastSource(days))
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (hasCachedForecast) setForecastLoading(false);
      }
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (fetchInFlightRef.current) return;
    fetchInFlightRef.current = true;
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

      const readRawCache = <T>(key: string): T | null => {
        if (typeof window === "undefined") return null;
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        try {
          return JSON.parse(raw) as T;
        } catch {
          return null;
        }
      };

      // The server fetches and caches river, weather, future-weather, upstream
      // and warnings data every 15 minutes (see /api/conditions), so this is
      // normally a fast cache hit rather than a live call to three external
      // APIs. If the request to our own API fails outright, each source
      // falls back independently to its own last-known cached value rather
      // than the whole update failing.
      let apiResponse = await withRetry(async () => {
        const res = await fetch("/api/conditions");
        if (!res.ok)
          throw new Error(`Conditions API fetch failed: ${res.status}`);
        return (await res.json()) as ConditionsApiResponse;
      }).catch((err) => {
        console.error("Failed to fetch /api/conditions:", err);
        return null;
      });

      // A cache that's gone stale (e.g. the first open after an overnight
      // gap with no visitors) would otherwise sit stale until someone else's
      // request happens to land after Vercel's background revalidation
      // finishes - force one genuinely live fetch instead of waiting on that.
      const isStale =
        !apiResponse ||
        Date.now() - new Date(apiResponse.fetchedAt).getTime() >
          LIVE_REFETCH_AFTER_MS;
      if (isStale) {
        // no-store because this route exists purely to sidestep caches: it
        // sets no cache-control of its own, and a browser that heuristically
        // held on to the previous response would hand back the very staleness
        // this call is here to break out of.
        const liveResponse = await fetch("/api/conditions/live", {
          cache: "no-store",
        })
          .then((res) =>
            res.ok ? (res.json() as Promise<ConditionsApiResponse>) : null
          )
          .catch((err) => {
            console.error("Failed to force-refresh /api/conditions/live:", err);
            return null;
          });
        if (liveResponse) apiResponse = liveResponse;
      }

      const riverData =
        apiResponse?.river ??
        readRawCache<RiverDataResult>(STORAGE_KEYS.RIVER_DATA_RAW);
      const weatherData =
        apiResponse?.weather ??
        readRawCache<WeatherData>(STORAGE_KEYS.WEATHER_DATA_RAW);
      const futureWeatherData =
        apiResponse?.futureWeather ??
        readRawCache<FutureWeatherData>(STORAGE_KEYS.FUTURE_WEATHER_DATA_RAW);
      const upstream = apiResponse?.upstream ?? {
        forecasts: [],
        observations: [],
        currentLevel: null,
      };
      const warningsData = apiResponse?.warnings ?? [];
      // Reflects when the data was actually fetched from upstream (so a
      // 15-minute-old cache hit still reports its true age), falling back to
      // the previous cached conditions' timestamp if this request failed
      // entirely.
      const fetchedAt =
        apiResponse?.fetchedAt ??
        readRawCache<KayakConditions>(STORAGE_KEYS.CONDITIONS)?.lastUpdated ??
        new Date().toISOString();

      if (!riverData || !weatherData || !futureWeatherData) {
        throw new Error(
          "One or more data sources failed and no cached fallback was available"
        );
      }

      // Process current conditions
      setRiverGraphData(riverData.historicalData);
      setRiverChange1h(riverData.change1h);
      setRiverChange24h(riverData.change24h);
      setRiverChange8h(riverData.change8h);
      setRiverChange5d(riverData.change5d);

      const {
        conditions: built,
        forecastDays: days,
        forecastPoints,
      } = buildKayakData({
        river: riverData,
        weather: weatherData,
        futureWeather: futureWeatherData,
        upstream,
        warnings: warningsData,
        fetchedAt,
      });
      conditionsObj = built;
      setConditions(conditionsObj);
      setLoading(false);
      hasConditionsRef.current = true;
      lastFetchedAtRef.current = new Date(fetchedAt).getTime();

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
            : OFFLINE_NO_CACHE_ERROR
          : hasCache
            ? null
            : "Failed to load conditions. Check your connection and tap refresh to try again."
      );
    } finally {
      fetchInFlightRef.current = false;
      setLastFetchStale(
        lastFetchedAtRef.current > 0 &&
          Date.now() - lastFetchedAtRef.current > LIVE_REFETCH_AFTER_MS
      );
      setLoading(false);
      setForecastLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // Self-heal long-lived tabs: a phone re-opening the app (or regaining
  // signal) with data older than the cache window refetches immediately -
  // well before the stale banner is due, so coming back to the app doesn't
  // show the banner and then make you tap refresh to clear it.
  useEffect(() => {
    const refetchIfStale = () => {
      if (document.visibilityState !== "visible") return;
      if (!navigator.onLine) return;
      const isStale =
        Date.now() - lastFetchedAtRef.current > LIVE_REFETCH_AFTER_MS;
      if (isStale) fetchData();
    };
    // A page restored from the back/forward cache never remounts, so the
    // fetch-on-mount above doesn't run - and a restore that was already
    // visible when it was frozen (a back navigation, rather than the app
    // being switched away from) fires no visibilitychange either. pageshow
    // is the one event both paths share.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) refetchIfStale();
    };
    document.addEventListener("visibilitychange", refetchIfStale);
    window.addEventListener("online", refetchIfStale);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      document.removeEventListener("visibilitychange", refetchIfStale);
      window.removeEventListener("online", refetchIfStale);
      window.removeEventListener("pageshow", handlePageShow);
    };
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
    isRefreshing,
    lastFetchStale,
    refetch: fetchData,
  };
};

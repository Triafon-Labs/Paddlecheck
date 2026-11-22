import { fetchRiverData, fetchUpstreamForecast } from "@/lib/river";
import { fetchWeatherData, fetchFutureWeatherData } from "@/lib/weather";
import { fetchWeatherWarnings } from "@/lib/metOfficeWarnings";
import { FetchLiveness } from "@/lib/fetchCache";
import {
  RIVER_STATION_ID,
  LATITUDE,
  LONGITUDE,
  HISTORICAL_DAYS,
} from "@/lib/config";
import { UpstreamData, ConditionsApiResponse, ConditionsSource } from "@/types";

// Shared by /api/conditions (cached, revalidate: 900) and
// /api/conditions/live (liveness.live: true, bypasses the cache) so both
// routes fetch and assemble the payload identically.
//
// River, weather and future-weather are fetched independently so a failure
// in one (e.g. the EA river API blipping) doesn't discard data that arrived
// fine from the others - each is null'd out on failure and the client falls
// back to its own last-known cached value for just that source.
export const getConditionsPayload = async (
  liveness: FetchLiveness = {}
): Promise<ConditionsApiResponse> => {
  const failed: ConditionsSource[] = [];
  const [river, weather, futureWeather, upstream, warnings] = await Promise.all(
    [
      fetchRiverData(RIVER_STATION_ID, HISTORICAL_DAYS, liveness).catch(
        (err) => {
          console.error("Failed to fetch river data:", err);
          failed.push("river");
          return null;
        }
      ),
      fetchWeatherData(LATITUDE, LONGITUDE, liveness).catch((err) => {
        console.error("Failed to fetch weather data:", err);
        failed.push("weather");
        return null;
      }),
      fetchFutureWeatherData(LATITUDE, LONGITUDE, liveness).catch((err) => {
        console.error("Failed to fetch future weather data:", err);
        failed.push("futureWeather");
        return null;
      }),
      fetchUpstreamForecast(liveness).catch((err) => {
        console.error("Failed to fetch upstream forecast:", err);
        failed.push("upstream");
        return { forecasts: [], observations: [], currentLevel: null };
      }),
      fetchWeatherWarnings(liveness).catch((err) => {
        console.error("Failed to fetch weather warnings:", err);
        failed.push("warnings");
        return [];
      }),
    ]
  );

  // fetchUpstreamForecast returns Date objects; the wire shape (UpstreamData)
  // uses ISO strings, so this is where that boundary is actually crossed
  // rather than relying on NextResponse.json's implicit serialization to
  // paper over the mismatch.
  const upstreamDTO: UpstreamData = {
    currentLevel: upstream.currentLevel,
    forecasts: upstream.forecasts.map((f) => ({
      timestamp: f.timestamp.toISOString(),
      level: f.level,
    })),
    observations: upstream.observations.map((o) => ({
      timestamp: o.timestamp.toISOString(),
      level: o.level,
    })),
  };

  return {
    river,
    weather,
    futureWeather,
    upstream: upstreamDTO,
    warnings,
    failed,
    fetchedAt: new Date().toISOString(),
  };
};

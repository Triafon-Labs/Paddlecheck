import { NextResponse } from "next/server";
import { fetchRiverData, fetchBewdleyForecast } from "@/lib/river";
import { fetchWeatherData, fetchFutureWeatherData } from "@/lib/weather";
import { fetchWeatherWarnings } from "@/lib/metOfficeWarnings";
import {
  RIVER_STATION_ID,
  LATITUDE,
  LONGITUDE,
  HISTORICAL_DAYS,
} from "@/lib/config";

// River, weather and future-weather are fetched independently so a failure in
// one (e.g. the EA river API blipping) doesn't discard data that arrived fine
// from the others - each is null'd out on failure and the client falls back
// to its own last-known cached value for just that source.
export async function GET() {
  const [river, weather, futureWeather, bewdley, warnings] = await Promise.all([
    fetchRiverData(RIVER_STATION_ID, HISTORICAL_DAYS).catch((err) => {
      console.error("Failed to fetch river data:", err);
      return null;
    }),
    fetchWeatherData(LATITUDE, LONGITUDE).catch((err) => {
      console.error("Failed to fetch weather data:", err);
      return null;
    }),
    fetchFutureWeatherData(LATITUDE, LONGITUDE).catch((err) => {
      console.error("Failed to fetch future weather data:", err);
      return null;
    }),
    fetchBewdleyForecast().catch((err) => {
      console.error("Failed to fetch Bewdley forecast:", err);
      return { forecasts: [], observations: [], currentLevel: null };
    }),
    fetchWeatherWarnings().catch((err) => {
      console.error("Failed to fetch weather warnings:", err);
      return [];
    }),
  ]);

  return NextResponse.json({
    river,
    weather,
    futureWeather,
    bewdley,
    warnings,
    // When this response is served from Vercel's Data Cache, fetchedAt still
    // reflects the time the upstream sources were actually fetched - not when
    // this particular client request landed - so staleness can be judged
    // against real data age.
    fetchedAt: new Date().toISOString(),
  });
}

import { WeatherData, FutureWeatherData } from "@/types";
import { API_ENDPOINTS, VISIBILITY_DESCRIPTIONS, isRainy } from "@/lib/config";
import { FetchLiveness, fetchCacheOptions } from "@/lib/fetchCache";

export const fetchWeatherData = async (
  latitude: number,
  longitude: number,
  liveness: FetchLiveness = {}
): Promise<WeatherData> => {
  const response = await fetch(
    `${API_ENDPOINTS.WEATHER}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,visibility,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code&wind_speed_unit=mph&timezone=Europe%2FLondon`,
    fetchCacheOptions(liveness)
  );
  if (!response.ok)
    throw new Error(`Weather API fetch failed: ${response.status}`);
  const data = await response.json();

  const current = data.current;
  return {
    temperature: current.temperature_2m,
    windSpeed: current.wind_speed_10m,
    windGust: current.wind_gusts_10m,
    windDirection: current.wind_direction_10m,
    rain: isRainy(current.weather_code),
    visibility: current.visibility, // visibility in metres
    weatherCode: current.weather_code,
  };
};

export const degreesToCompass = (degrees: number): string => {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(degrees / 45) % 8];
};

export const getVisibilityDescription = (visibility: number): string => {
  if (visibility > VISIBILITY_DESCRIPTIONS.EXCELLENT.min)
    return VISIBILITY_DESCRIPTIONS.EXCELLENT.desc;
  if (visibility > VISIBILITY_DESCRIPTIONS.GOOD.min)
    return VISIBILITY_DESCRIPTIONS.GOOD.desc;
  if (visibility > VISIBILITY_DESCRIPTIONS.MODERATE.min)
    return VISIBILITY_DESCRIPTIONS.MODERATE.desc;
  if (visibility > VISIBILITY_DESCRIPTIONS.POOR.min)
    return VISIBILITY_DESCRIPTIONS.POOR.desc;
  return VISIBILITY_DESCRIPTIONS.VERY_POOR.desc;
};

const WMO_WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  97: "Heavy thunderstorm",
  98: "Thunderstorm with duststorm",
  99: "Thunderstorm with heavy hail",
};

export const getWeatherDescription = (code: number): string => {
  return WMO_WEATHER_CODES[code] || "Unknown";
};

export const fetchFutureWeatherData = async (
  latitude: number,
  longitude: number,
  liveness: FetchLiveness = {}
): Promise<FutureWeatherData> => {
  const response = await fetch(
    `${API_ENDPOINTS.WEATHER}?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation,visibility,wind_speed_10m,wind_gusts_10m,weather_code&daily=sunrise,sunset&wind_speed_unit=mph&forecast_days=5&timezone=Europe%2FLondon`,
    fetchCacheOptions(liveness)
  );
  if (!response.ok)
    throw new Error(`Future weather API fetch failed: ${response.status}`);
  const data = await response.json();
  return data;
};

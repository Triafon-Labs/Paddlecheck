import { WeatherData, FutureWeatherData } from "@/types";
import {
  API_ENDPOINTS,
  EXTRA_WIND_MODELS,
  VISIBILITY_DESCRIPTIONS,
  isRainy,
} from "@/lib/config";
import { FetchLiveness, fetchCacheOptions } from "@/lib/fetchCache";

type MaybeNumber = number | null | undefined;

// The highest of the values that are actually numbers, or the first value
// when none are (so a missing best_match reading stays missing).
const highest = <T extends MaybeNumber>(
  first: T,
  ...rest: MaybeNumber[]
): T | number => {
  const numbers = [first, ...rest].filter(
    (v): v is number => typeof v === "number"
  );
  return numbers.length ? Math.max(...numbers) : first;
};

interface WindReading {
  speed: MaybeNumber;
  gust: MaybeNumber;
}

// Open-Meteo returns only one model's values for `current` however many are
// asked for, so each extra model gets its own request.
const fetchCurrentWind = async (
  model: string,
  latitude: number,
  longitude: number,
  liveness: FetchLiveness
): Promise<WindReading | null> => {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.WEATHER}?latitude=${latitude}&longitude=${longitude}&current=wind_speed_10m,wind_gusts_10m&models=${model}&wind_speed_unit=mph&timezone=Europe%2FLondon`,
      fetchCacheOptions(liveness)
    );
    if (!response.ok) throw new Error(`status ${response.status}`);
    const { current } = await response.json();
    return { speed: current?.wind_speed_10m, gust: current?.wind_gusts_10m };
  } catch (err) {
    console.error(`Failed to fetch ${model} wind:`, err);
    return null;
  }
};

// Hourly wind from every extra model, keyed by time. Multi-model hourly
// responses suffix each field with the model name.
const fetchHourlyWind = async (
  latitude: number,
  longitude: number,
  liveness: FetchLiveness
): Promise<Map<string, WindReading[]>> => {
  const byTime = new Map<string, WindReading[]>();
  try {
    const response = await fetch(
      `${API_ENDPOINTS.WEATHER}?latitude=${latitude}&longitude=${longitude}&hourly=wind_speed_10m,wind_gusts_10m&models=${EXTRA_WIND_MODELS.join(",")}&wind_speed_unit=mph&forecast_days=5&timezone=Europe%2FLondon`,
      fetchCacheOptions(liveness)
    );
    if (!response.ok) throw new Error(`status ${response.status}`);
    const { hourly } = await response.json();
    (hourly.time as string[]).forEach((time, i) => {
      byTime.set(
        time,
        EXTRA_WIND_MODELS.map((model) => ({
          speed: hourly[`wind_speed_10m_${model}`]?.[i],
          gust: hourly[`wind_gusts_10m_${model}`]?.[i],
        }))
      );
    });
  } catch (err) {
    console.error("Failed to fetch hourly wind from extra models:", err);
  }
  return byTime;
};

export const fetchWeatherData = async (
  latitude: number,
  longitude: number,
  liveness: FetchLiveness = {}
): Promise<WeatherData> => {
  const [response, ...extraWind] = await Promise.all([
    fetch(
      `${API_ENDPOINTS.WEATHER}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,precipitation,visibility,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code&wind_speed_unit=mph&timezone=Europe%2FLondon`,
      fetchCacheOptions(liveness)
    ),
    ...EXTRA_WIND_MODELS.map((model) =>
      fetchCurrentWind(model, latitude, longitude, liveness)
    ),
  ]);
  if (!response.ok)
    throw new Error(`Weather API fetch failed: ${response.status}`);
  const data = await response.json();

  const current = data.current;
  const otherWind = extraWind.filter((w): w is WindReading => w !== null);
  return {
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    windSpeed: highest(
      current.wind_speed_10m,
      ...otherWind.map((w) => w.speed)
    ),
    windGust: highest(current.wind_gusts_10m, ...otherWind.map((w) => w.gust)),
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

// The same eight points in words, hyphenated as UK forecasts write them.
export const degreesToCompassName = (degrees: number): string => {
  const dirs = [
    "north",
    "north-east",
    "east",
    "south-east",
    "south",
    "south-west",
    "west",
    "north-west",
  ];
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
  const [response, extraWind] = await Promise.all([
    fetch(
      `${API_ENDPOINTS.WEATHER}?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation,visibility,wind_speed_10m,wind_gusts_10m,weather_code&daily=sunrise,sunset&wind_speed_unit=mph&forecast_days=5&timezone=Europe%2FLondon`,
      fetchCacheOptions(liveness)
    ),
    fetchHourlyWind(latitude, longitude, liveness),
  ]);
  if (!response.ok)
    throw new Error(`Future weather API fetch failed: ${response.status}`);
  const data: FutureWeatherData = await response.json();
  const { hourly } = data;
  hourly.time.forEach((time, i) => {
    const others = extraWind.get(time) ?? [];
    hourly.wind_speed_10m[i] = highest(
      hourly.wind_speed_10m[i],
      ...others.map((w) => w.speed)
    );
    hourly.wind_gusts_10m[i] = highest(
      hourly.wind_gusts_10m[i],
      ...others.map((w) => w.gust)
    );
  });
  return data;
};

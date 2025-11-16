import { WeatherData, FutureWeatherData } from "@/types";
import { API_ENDPOINTS, VISIBILITY_DESCRIPTIONS } from "@/lib/config";

// According to WMO weather interpretation codes
const RAIN_CODES = new Set(Array.from({ length: 50 }, (_, i) => i + 50));

export const fetchWeatherData = async (
  latitude: number,
  longitude: number,
): Promise<WeatherData> => {
  const response = await fetch(
    `${API_ENDPOINTS.WEATHER}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,is_day,visibility,wind_speed_10m,weather_code&wind_speed_unit=mph&timezone=Europe%2FLondon`,
  );
  const data = await response.json();

  const current = data.current;
  return {
    temperature: current.temperature_2m,
    windSpeed: current.wind_speed_10m,
    rain: RAIN_CODES.has(current.weather_code),
    dark: !current.is_day,
    visibility: current.visibility, // visibility in meters
    weatherCode: current.weather_code,
  };
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

export const fetchFutureWeatherData = async (
  latitude: number,
  longitude: number,
): Promise<FutureWeatherData> => {
  const response = await fetch(
    `${API_ENDPOINTS.WEATHER}?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation,visibility,wind_speed_10m,weather_code,is_day&daily=sunrise,sunset&wind_speed_unit=mph&forecast_days=2&timezone=Europe%2FLondon`,
  );
  const data = await response.json();
  return data;
};

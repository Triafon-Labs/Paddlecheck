import { WeatherData, HourlyWeatherData } from "@/types";

export const fetchWeatherData = async (
  latitude: number,
  longitude: number
): Promise<WeatherData> => {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,is_day,visibility,wind_speed_10m,weather_code&wind_speed_unit=mph`
  );
  const data = await response.json();

  const current = data.current;
  return {
    temperature: current.temperature_2m,
    windSpeed: current.wind_speed_10m,
    rain: current.precipitation > 0,
    dark: !current.is_day,
    visibility: current.visibility, // visibility in meters
    weatherCode: current.weather_code,
  };
};

export const getVisibilityDescription = (visibility: number): string => {
  if (visibility > 10000) {
    return "Excellent";
  }
  if (visibility > 5000) {
    return "Good";
  }
  if (visibility > 2000) {
    return "Moderate";
  }
  if (visibility > 1000) {
    return "Poor";
  }
  return "Very Poor";
};

export const fetchFutureWeatherData = async (
  latitude: number,
  longitude: number
): Promise<HourlyWeatherData> => {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation,visibility,wind_speed_10m,weather_code&wind_speed_unit=mph&forecast_days=2`
  );
  const data = await response.json();
  return data.hourly;
};
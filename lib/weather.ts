import { WeatherData } from "@/types";

export const fetchWeatherData = async (
  latitude: number,
  longitude: number
): Promise<WeatherData> => {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,is_day,visibility,wind_speed_10m&wind_speed_unit=ms`
  );
  const data = await response.json();

  const current = data.current;
  return {
    temperature: current.temperature_2m,
    windSpeed: current.wind_speed_10m,
    rain: current.precipitation > 0,
    dark: !current.is_day,
    visibility: current.visibility / 1000, // convert meters to km
  };
};

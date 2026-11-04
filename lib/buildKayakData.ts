import {
  KayakConditions,
  ChartDataPoint,
  DayForecast,
  WeatherData,
  FutureWeatherData,
  RiverDataResult,
  UpstreamData,
  WeatherWarning,
  ForecastSource,
} from "@/types";
import {
  calculateFinalRagStatus,
  findLevelDescription,
  calculateInitialRagStatus,
  isRainWhileWarm,
  RAG_STATUS_MAP,
  ragHeight,
} from "@/lib/rag";
import {
  forecastRiverLevel,
  getUpstreamBasedClubLevel,
  getUpstreamEndSlope,
} from "@/lib/river";
import { getVisibilityDescription, getWeatherDescription } from "@/lib/weather";
import {
  isRainy,
  TIME_PERIODS,
  LINEAR_FORECAST_HOURS,
  RIVER_GRAPH_FORECAST_HOURS,
} from "@/lib/config";
import {
  getLondonHHMM,
  getLondonHour,
  hhmmOfISO,
  isDarkHour,
} from "@/lib/time";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface KayakDataSources {
  river: RiverDataResult;
  weather: WeatherData;
  futureWeather: FutureWeatherData;
  upstream: UpstreamData;
  warnings: WeatherWarning[];
  fetchedAt: string;
}

export interface KayakData {
  conditions: KayakConditions;
  forecastDays: DayForecast[];
  // The upstream-backed hours drawn on the river level graph
  forecastPoints: ChartDataPoint[];
}

// Turns the raw sources into the current conditions and the 5-day hourly
// forecast. Pure, so the client (useKayakData) and the server (/api/briefing)
// build exactly the same picture from the same data.
export const buildKayakData = (
  {
    river: riverData,
    weather: weatherData,
    futureWeather: futureWeatherData,
    upstream,
    warnings: warningsData,
    fetchedAt,
  }: KayakDataSources,
  now: Date = new Date()
): KayakData => {
  const upstreamRaw = upstream;
  const upstreamData = {
    currentLevel: upstreamRaw.currentLevel,
    forecasts: upstreamRaw.forecasts.map((f) => ({
      timestamp: new Date(f.timestamp),
      level: f.level,
    })),
    observations: upstreamRaw.observations.map((o) => ({
      timestamp: new Date(o.timestamp),
      level: o.level,
    })),
  };

  const todaySunrise = futureWeatherData.daily.sunrise[0] ?? null;
  const todaySunset = futureWeatherData.daily.sunset[0] ?? null;
  const currentTimeHHMM = getLondonHHMM(now);
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
    apparentTemperature: weatherData.apparentTemperature,
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
  const rainWhileWarm = isRainWhileWarm(currentConditions);
  const visibilityDescription = getVisibilityDescription(
    currentConditions.visibility ?? 0
  );
  const weatherDescription = getWeatherDescription(
    currentConditions.weatherCode ?? 0
  );

  const conditions: KayakConditions = {
    ...currentConditions,
    initialStatus,
    overallStatus: status,
    reasons: reasons,
    rainWhileWarm,
    warnings: warningsData,
    levelChange: {
      value: riverData.change8h ?? 0,
      period: "8h",
    },
    launchMessage: findLevelDescription(riverData.latestLevel ?? 0),
    lastUpdated: fetchedAt,
    visibilityDescription,
    weatherDescription,
  };

  // Build 5-day forecast (today + 4 days ahead)
  const currentHour = getLondonHour(now);
  const days: DayForecast[] = [];
  const forecastPoints: ChartDataPoint[] = [];

  // The club gauge's own linear trend (m/h), for when there's no upstream data
  // at all. Once an upstream forecast has run out, the fallback continues
  // the upstream gauge's final trend instead (getUpstreamEndSlope).
  const clubSlopePerHour =
    forecastRiverLevel(
      riverData.latestLevel ?? 0,
      riverData.historicalData,
      1
    ) - (riverData.latestLevel ?? 0);
  const upstreamSlopePerHour = getUpstreamEndSlope(
    upstreamData.forecasts,
    upstreamData.observations
  );

  // Tracks the last upstream-based forecast level and the hoursAhead at
  // which the upstream data ran out, so linear regression is anchored there.
  // The upstream delta is measured from the moment the club gauge's latest
  // reading was taken, so the forecast picks up exactly where it ends.
  const latestReading =
    riverData.historicalData[riverData.historicalData.length - 1];
  const latestReadingTime = latestReading
    ? new Date(latestReading.dateTime)
    : now;

  let lastUpstreamForecast: number | null = null;
  let transitionHoursAhead: number | null = null;

  for (let d = 0; d < 5; d++) {
    const dayStartIndex = d * 24;
    const sunrise = futureWeatherData.daily.sunrise[d] ?? null;
    const sunset = futureWeatherData.daily.sunset[d] ?? null;

    // Skip the hour we're already in - it's a mix of past and future by
    // the time it's shown, so the forecast starts from the next full hour.
    const hourStart = d === 0 ? currentHour + 1 : 0;
    const graphData = [];

    for (let h = hourStart; h < 24; h++) {
      const index = dayStartIndex + h;
      if (index >= futureWeatherData.hourly.time.length) break;

      // Hours ahead from now for river level forecast
      const hoursAhead = d * 24 + h - currentHour;
      const targetClubTime = new Date(
        now.getTime() + hoursAhead * TIME_PERIODS.ONE_HOUR
      );

      const upstreamLevel =
        upstreamData.currentLevel !== null
          ? getUpstreamBasedClubLevel(
              riverData.latestLevel ?? 0,
              upstreamData.forecasts,
              upstreamData.observations,
              targetClubTime,
              latestReadingTime
            )
          : null;

      let forecastSource: ForecastSource;
      let forecastRiverLevel: number;
      if (upstreamLevel !== null) {
        forecastSource = "upstream";
        forecastRiverLevel = upstreamLevel;
        lastUpstreamForecast = upstreamLevel;
        transitionHoursAhead = hoursAhead;
      } else {
        // Anchor the trend to the last upstream-forecasted level so there's
        // no jump at the transition point, and continue the upstream gauge's own
        // trend from there when there is one. The trend only runs for
        // LINEAR_FORECAST_HOURS; after that the level is held where the
        // trend left it rather than extrapolated for days.
        const baseLevel = lastUpstreamForecast ?? (riverData.latestLevel || 0);
        const baseHours = transitionHoursAhead ?? 0;
        const linearHours = Math.min(
          hoursAhead - baseHours,
          LINEAR_FORECAST_HOURS
        );
        forecastSource =
          hoursAhead - baseHours > LINEAR_FORECAST_HOURS ? "held" : "linear";
        const slopePerHour =
          lastUpstreamForecast !== null && upstreamSlopePerHour !== null
            ? upstreamSlopePerHour
            : clubSlopePerHour;
        forecastRiverLevel = Math.max(
          0,
          baseLevel + slopePerHour * linearHours
        );
      }

      // The hour containing sunrise or sunset is dark if more than
      // DARK_HOUR_FRACTION of it is (isDarkHour, lib/time.ts). Either way
      // formatWindow
      // (lib/forecast.ts) trims a window's displayed start/end to the
      // precise sunrise/sunset time using the neighbouring dark-only hour.
      const dark = isDarkHour(h, sunrise, sunset);

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
      const forecastRainWhileWarm = isRainWhileWarm(forecastConditions);

      graphData.push({
        time: `${h}:00`,
        status: forecastStatus,
        reasons: forecastReasons,
        value: ragHeight[forecastStatus] || 0.1,
        forecastLevel: forecastRiverLevel,
        forecastSource,
        dark,
        temperature: futureWeatherData.hourly.temperature_2m[index],
        windSpeed: futureWeatherData.hourly.wind_speed_10m[index],
        windGust: futureWeatherData.hourly.wind_gusts_10m[index],
        rainWhileWarm: forecastRainWhileWarm,
        weatherDescription: getWeatherDescription(
          futureWeatherData.hourly.weather_code[index]
        ),
      });

      // Only include upstream-backed points in the river level graph forecast
      if (
        forecastSource === "upstream" &&
        hoursAhead <= RIVER_GRAPH_FORECAST_HOURS
      ) {
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
    const label = d === 0 ? "Today" : DAY_NAMES[dateObj.getDay()];

    days.push({ date: dayDateStr, label, graphData, sunrise, sunset });
  }

  return { conditions, forecastDays: days, forecastPoints };
};

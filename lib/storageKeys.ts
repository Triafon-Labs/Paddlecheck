export const STORAGE_KEYS = {
  THEME_MODE: "themeMode",
  AUTO_SUMMARISE: "autoSummarise",
  PADDLER_LEVEL: "paddlerLevel",
  RIVER_GRAPH_TIME_RANGE: "riverGraphTimeRange",
  FORECAST_SHOW_NIGHT: "forecastShowNight",
  DISCLAIMER_ACCEPTED: "disclaimerAccepted",
  CONDITIONS: "paddlecheck_conditions",
  FORECAST_DAYS: "paddlecheck_forecastDays",
  FORECAST_DATA: "paddlecheck_forecastData",
  RIVER_GRAPH_DATA: "paddlecheck_riverGraphData",
  RIVER_CHANGE_1H: "paddlecheck_riverChange1h",
  RIVER_CHANGE_24H: "paddlecheck_riverChange24h",
  RIVER_CHANGE_8H: "paddlecheck_riverChange8h",
  RIVER_CHANGE_5D: "paddlecheck_riverChange5d",
  RIVER_DATA_RAW: "paddlecheck_riverDataRaw",
  WEATHER_DATA_RAW: "paddlecheck_weatherDataRaw",
  FUTURE_WEATHER_DATA_RAW: "paddlecheck_futureWeatherDataRaw",
} as const;

// Fired in this tab when a setting changes (the "storage" event only reaches
// other tabs), so anything reading that setting can pick it up straight away.
export const SETTINGS_CHANGED_EVENT = "paddlecheck:settings-changed";

// Fired in this tab when the paddler level changes in Settings.
export const PADDLER_LEVEL_CHANGED_EVENT = "paddlecheck:paddler-level-changed";

import {
  HelpOutlined,
  Thermostat,
  Air,
  WaterDrop,
  NightsStay,
  Thunderstorm,
  Flood,
  AcUnit,
  Foggy,
} from "@mui/icons-material";
import {
  ForecastSource,
  PaddlerType,
  PaddlingExtraRule,
  PaddlingVerdict,
  Status,
  StatusStep,
} from "@/types";
import { STATUS_COLORS, ON_STATUS_COLORS } from "./statusColors";
import { CLUB } from "./clubConfig";
import { CONDITIONS_REVALIDATE_SECONDS } from "./fetchCache";

// ============================================================================
// CONFIGURATION
// ============================================================================
// Everything specific to a club lives in clubs/<CLUB>.yaml (chosen in
// next.config.ts; clubs/example.yaml when CLUB isn't set), read
// and checked by lib/clubConfig.ts. This file turns it into the constants the
// app uses, alongside the app's own settings (data sources, caching, chart
// styling) that a club shouldn't need to touch. See README.md.
// ============================================================================

// --- App and Club Identity (clubs/*.yaml: app, club) ---
export const APP_NAME = CLUB.appName;
export const CLUB_NAME = CLUB.club.name;
export const CLUB_SHORT_NAME = CLUB.club.shortName;
export const FEEDBACK_URL = CLUB.club.feedbackUrl;
export const USEFUL_LINKS = CLUB.club.usefulLinks;

// Shown in the first-run pop-up (DisclaimerDialog) and in Settings → About.
// Bump DISCLAIMER_VERSION when the wording changes materially, so everyone
// who accepted the old text is asked again.
export const DISCLAIMER = `${APP_NAME} brings together live river levels and weather forecasts to give you a quick picture of conditions now and over the next few days. It's an unofficial guide, not a club decision – data can occasionally be delayed or inaccurate, and coaches make the final call on whether it's safe to paddle. Always check the river yourself before heading out.`;
export const DISCLAIMER_VERSION = "1";

// --- River and Weather Service (clubs/*.yaml: location, river) ---
export const RIVER_STATION_ID = CLUB.river.stationId;
export const LATITUDE = CLUB.latitude;
export const LONGITUDE = CLUB.longitude;
export const HISTORICAL_DAYS = 5;

// The gauge whose Environment Agency forecast drives the level forecast,
// shifted forward by the travel time (null: continue the club gauge's trend).
export const UPSTREAM_CSV_URL: string | null = CLUB.river.forecastCsv;
export const UPSTREAM_TRAVEL_HOURS = CLUB.river.travelHours;

// How many hours at the end of the upstream series set the trend that the
// linear fallback continues once the upstream forecast runs out.
export const UPSTREAM_TREND_HOURS = 6;

// How long the linear trend is extrapolated once the upstream forecast
// runs out. Past this the level is held flat at the last estimate – a straight
// line carried on for days invents floods and droughts the river never sees.
export const LINEAR_FORECAST_HOURS = 18;

// How far ahead the river level graph's forecast view is drawn. Shorter than
// the upstream forecast on purpose: a round day keeps the view tidy, and the
// paddling forecast still uses the full upstream window.
export const RIVER_GRAPH_FORECAST_HOURS = 24;

// Dash pattern for each forecast source's level line, shared by the river
// level graph and the forecast chart: upstream tight, the linear trend wider.
// Held hours get no line (see ForecastRagGraph).
export const FORECAST_LINE_DASH: Record<
  Exclude<ForecastSource, "held">,
  string
> = {
  upstream: "2 3",
  linear: "6 4",
};

export const API_ENDPOINTS = {
  RIVER: `https://environment.data.gov.uk/flood-monitoring/id/stations`,
  WEATHER: `https://api.open-meteo.com/v1/forecast`,
};

// Open-Meteo's default model blend (best_match) can sit at the calm end of the
// models on a borderline day, so wind and gusts are also fetched from these
// models and the highest value is used. A model that fails or returns nothing
// is ignored, leaving best_match on its own.
export const EXTRA_WIND_MODELS = ["ukmo_seamless", "ecmwf_ifs025"];

// --- Met Office Weather Warnings (clubs/*.yaml: warnings) ---
export const MET_OFFICE_WARNINGS_RSS_URL = CLUB.warnings.feed;
export const WARNING_AREA = CLUB.warnings.area;

// --- Weather Warning Colors ---
export const WARNING_COLORS = {
  Red: STATUS_COLORS.red,
  Amber: STATUS_COLORS.amber,
  Yellow: STATUS_COLORS.yellow,
};

// --- Status steps (clubs/*.yaml: steps) ---
export const STATUS_STEPS: readonly StatusStep[] = CLUB.steps;

// Shown when the data needed for a status is missing.
export const UNKNOWN_STATUS = {
  name: "Unknown",
  color: STATUS_COLORS.grey,
  onColor: ON_STATUS_COLORS.grey,
  emoji: "🤷",
  icon: HelpOutlined,
  description: "Data unavailable.",
} as const;

// --- Which rules apply (clubs/*.yaml: rules) ---
export const RULES = {
  WEATHER_TABLE: CLUB.rules.weatherTable,
  DARKNESS: CLUB.rules.darkness,
  FOG: CLUB.rules.fog,
  THUNDERSTORMS: CLUB.rules.thunderstorms,
};

// --- Paddler levels (clubs/*.yaml: paddlerLevels) ---
export const PADDLER_LEVELS: readonly PaddlerType[] = CLUB.paddlerLevels;

// --- Weather table (clubs/*.yaml: weatherTable, used when RULES.WEATHER_TABLE is on) ---
// Temperature band -> weather -> the resulting step for each river level
// band, as step indexes into STATUS_STEPS.
export const CRITERIA_TABLE: {
  [key: string]: { [key: string]: number[] };
} = CLUB.weatherTable;

// Club values from clubs/*.yaml (thresholds); the rest are the app's own.
export const THRESHOLDS = {
  TEMP_HIGH: CLUB.thresholds.tempHigh,
  TEMP_MODERATE: CLUB.thresholds.tempModerate,
  WIND_HIGH: CLUB.thresholds.windHigh,
  // Gusts at or above this are mentioned in the share text and the AI
  // briefing's forecast summary (lib/forecast.ts). Never fed into the RAG
  // calculation, which only reacts to sustained wind speed.
  WIND_GUST_NOTABLE: 15,
  VISIBILITY_POOR: CLUB.thresholds.visibilityPoor,
  THUNDERSTORM_CODES: [95, 96, 97, 98, 99],
  FOG_CODES: [40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
  RIVER_LEVEL_TREND_THRESHOLD: 0.1,
  // A forecast hour counts as dark - and takes the "Dark" step - when more
  // than this fraction of it falls before sunrise or after sunset. A quarter,
  // so an hour only counts as light when at least three quarters of it is:
  // more than 15 minutes of dark in an hour makes it a dark hour.
  DARK_HOUR_FRACTION: CLUB.thresholds.darkHourFraction,
};

// --- Who can paddle (clubs/*.yaml: whoCanPaddle, whoCanPaddleExtras) ---
export const WHO_CAN_PADDLE: Record<
  Status,
  PaddlingVerdict | Record<PaddlerType, PaddlingVerdict>
> = CLUB.whoCanPaddle;
export const WHO_CAN_PADDLE_EXTRAS: PaddlingExtraRule[] =
  CLUB.whoCanPaddleExtras;

// WMO weather interpretation codes 50–99 cover drizzle, rain, snow, showers
// and thunderstorms. Used as the single source of truth for "is it raining?"
// across both live conditions and the hourly forecast. Thunderstorms (95–99)
// are excluded as they are treated separately from rain.
const RAIN_CODES = new Set(
  Array.from({ length: 50 }, (_, i) => i + 50).filter(
    (code) => !THRESHOLDS.THUNDERSTORM_CODES.includes(code)
  )
);
export const isRainy = (weatherCode: number): boolean =>
  RAIN_CODES.has(weatherCode);

// --- Conditions Key (clubs/*.yaml: conditionsKey) ---
export const CONDITIONS_KEY_WEATHER = CLUB.conditionsKey;

// --- UI Text and Icons ---
// Icons for the weather contributing factors. The river level ones come from
// STATUS_STEPS (reasonIcon).
export const REASON_ICONS: Record<string, React.ElementType> = {
  "Moderately low temperature": Thermostat,
  "Low temperature": AcUnit,
  "High winds": Air,
  Rain: WaterDrop,
  Dark: NightsStay,
  Foggy: Foggy,
  "River level is dangerously high": Flood,
  Thunderstorms: Thunderstorm,
  "Missing data": HelpOutlined,
  "Could not determine conditions": HelpOutlined,
};

// --- Landmarks (clubs/*.yaml: landmarks) ---
export const LEVEL_DESCRIPTIONS: Record<number, string> = CLUB.landmarks;

export const VISIBILITY_DESCRIPTIONS: {
  [key: string]: { min: number; desc: string };
} = {
  EXCELLENT: { min: 10000, desc: "Excellent" },
  GOOD: { min: 5000, desc: "Good" },
  MODERATE: { min: 2000, desc: "Moderate" },
  POOR: { min: 1000, desc: "Poor" },
  VERY_POOR: { min: 0, desc: "Very Poor" },
};

// --- Time-based Constants ---
export const TIME_PERIODS = {
  ONE_HOUR: 1 * 60 * 60 * 1000,
  TWO_HOURS: 2 * 60 * 60 * 1000,
  SIX_HOURS: 6 * 60 * 60 * 1000,
  EIGHT_HOURS: 8 * 60 * 60 * 1000,
  TWELVE_HOURS: 12 * 60 * 60 * 1000,
  TWENTY_FOUR_HOURS: 24 * 60 * 60 * 1000,
};

// --- Data Freshness ---
// Two thresholds, deliberately different, because they answer different
// questions.
//
// LIVE_REFETCH_AFTER_MS - is this payload worth keeping? /api/conditions is
// cached for CONDITIONS_REVALIDATE_SECONDS, and once that window is up the
// cache hands the *expired* entry to whoever arrives first and regenerates
// behind them (stale-while-revalidate). A payload older than the window is
// therefore proof the cache turned over on this very request, so the client
// throws it away and makes a live fetch instead (/api/conditions/live). Set
// any higher and there is a band where the client accepts an entry the
// server itself has already expired.
//
// DATA_STALE_THRESHOLD_MS - is the data on screen old enough to warn about?
// A successful refresh can legitimately return anything up to one window old
// (a cache hit late in its life), so a warning set just above the window
// can come back a minute or two after a refresh that worked - and, while the
// cache keeps serving entries in that band, after the next refresh too. That
// is the "takes several refreshes to clear" behaviour. Two windows means a
// successful refresh always keeps the banner away for at least one whole
// window, so the banner only ever means a refresh failed or the page has
// been left open.
//
// fetchedAt is stamped by the server's clock and compared against the
// phone's, so neither threshold can be exact; the gap between them also
// absorbs clock skew.
export const LIVE_REFETCH_AFTER_MS = CONDITIONS_REVALIDATE_SECONDS * 1000;
export const DATA_STALE_THRESHOLD_MS = 2 * CONDITIONS_REVALIDATE_SECONDS * 1000;

// --- AI Summary ---
// Off when the site was built without GROQ_API_KEY: the Conditions Report
// section and its setting are then left out (see next.config.ts).
export const CONDITIONS_REPORT_ENABLED =
  process.env.NEXT_PUBLIC_CONDITIONS_REPORT === "on";
export const DEFAULT_AI_MODEL = "openai/gpt-oss-120b";
// Models /api/briefing will accept from the client. Anything else falls back
// to DEFAULT_AI_MODEL so visitors can't run arbitrary models on our API key.
export const ALLOWED_AI_MODELS = [DEFAULT_AI_MODEL];

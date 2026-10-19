import {
  HelpOutlined,
  Check,
  WarningAmberOutlined,
  DoNotDisturbOutlined,
  TrendingUpOutlined,
  Thermostat,
  CrisisAlert,
  Air,
  WaterDrop,
  NightsStay,
  Thunderstorm,
  Flood,
  Water,
  Waves,
  Tsunami,
  AcUnit,
  Foggy,
} from "@mui/icons-material";
import { ForecastSource, Status } from "@/types";
import { STATUS_COLORS, ON_STATUS_COLORS } from "./statusColors";
import { formatRiverLevel } from "./units";
import { CONDITIONS_REVALIDATE_SECONDS } from "./fetchCache";

// ============================================================================
// CONFIGURATION
// ============================================================================
// This file contains all the configuration for the Paddlecheck application.
// It is currently set up for Worcester Canoe Club (UK) on the River Severn.
// If you are forking this repo for another club, you will need to update
// the values below to match your location and river conditions.
// See README.md for a full adaptation guide.
// ============================================================================

// --- Club Identity ---
// Update these to reflect your own club.
export const CLUB_NAME = "Worcester Canoe Club";
export const CONTACT_EMAIL = "REDACTED";

// --- Club Information & Links ---
// Links displayed in the "Useful Links" section of the settings drawer.
// Replace or extend these with links relevant to your venue.
export const USEFUL_LINKS = [
  {
    name: "River Severn level at Worcester (Barbourne)",
    url: "https://check-for-flooding.service.gov.uk/station/2092",
  },
  {
    name: "River Severn level at Bewdley",
    url: "https://check-for-flooding.service.gov.uk/station/2001",
  },
  {
    name: "Worcester Canoe Club",
    url: "https://worcestercanoeclub.org/",
  },
];

// --- River and Weather Service ---
// Station ID for the Environment Agency Flood Monitoring API.
// Browse available stations at: https://environment.data.gov.uk/flood-monitoring/id/stations
// Find your nearest station, then copy the numeric ID from the URL (e.g. "2642").
export const RIVER_STATION_ID = "2642"; // Worcester (Barbourne)
export const LATITUDE = 52.2;
export const LONGITUDE = -2.2;
export const HISTORICAL_DAYS = 5;

// Upstream station forecast – used to improve near-future level forecasts.
// The app fetches CSV data from an upstream gauge and shifts it forward by
// BEWDLEY_TRAVEL_HOURS to estimate when a flood wave will arrive.
// CSV URLs follow the pattern: https://check-for-flooding.service.gov.uk/station-csv/<station-id>
// Set both to null / 0 if you don't have a useful upstream station.
export const BEWDLEY_CSV_URL =
  "https://check-for-flooding.service.gov.uk/station-csv/2001";
export const BEWDLEY_TRAVEL_HOURS = 6;

// How far ahead (at Worcester) the Bewdley-based forecast is used: its ~24h
// published forecast plus the travel time.
export const BEWDLEY_FORECAST_HOURS = 30;

// How long the local linear trend is extrapolated once the Bewdley forecast
// runs out. Past this the level is held flat at the last estimate – a straight
// line carried on for days invents floods and droughts the river never sees.
export const LINEAR_FORECAST_HOURS = 18;

// How far ahead the river level graph's forecast view is drawn. Shorter than
// BEWDLEY_FORECAST_HOURS on purpose: a round day keeps the view tidy, and the
// paddling forecast still uses the full Bewdley window.
export const RIVER_GRAPH_FORECAST_HOURS = 24;

// Dash pattern for each forecast source's level line, shared by the river
// level graph and the forecast chart: Bewdley tight, the linear trend wider.
// Held hours get no line (see ForecastRagGraph).
export const FORECAST_LINE_DASH: Record<
  Exclude<ForecastSource, "held">,
  string
> = {
  bewdley: "2 3",
  linear: "6 4",
};

export const API_ENDPOINTS = {
  RIVER: `https://environment.data.gov.uk/flood-monitoring/id/stations`,
  WEATHER: `https://api.open-meteo.com/v1/forecast`,
};

// --- Weather Warning Colors ---
export const WARNING_COLORS = {
  Red: STATUS_COLORS.red,
  Amber: STATUS_COLORS.amber,
  Yellow: STATUS_COLORS.yellow,
};

// --- RAG Status Definitions ---
export const RAG_STATUS_MAP: Record<number, Status> = {
  0: "Light Green",
  1: "Dark Green",
  2: "Amber",
  3: "Red",
};

export const RAG_HEIGHT_MAP: Record<Status, number> = {
  "Light Green": 1.0,
  "Dark Green": 0.75,
  Amber: 0.5,
  Red: 0.25,
  "No Paddling": 0.1,
  Unknown: 0.1,
};

// `color` is the status hue itself, `onColor` the label colour to put on top
// of it - see ON_STATUS_COLORS in lib/statusColors.ts for why the pairing
// isn't simply white throughout.
export const RAG_STATUS_UI: Record<
  Status,
  {
    color: string;
    onColor: string;
    emoji: string;
    icon: React.ElementType;
  }
> = {
  Unknown: {
    color: STATUS_COLORS.grey,
    onColor: ON_STATUS_COLORS.grey,
    emoji: "🤷",
    icon: HelpOutlined,
  },
  "Light Green": {
    color: STATUS_COLORS.lightGreen,
    onColor: ON_STATUS_COLORS.lightGreen,
    emoji: "✅",
    icon: Check,
  },
  "Dark Green": {
    color: STATUS_COLORS.darkGreen,
    onColor: ON_STATUS_COLORS.darkGreen,
    emoji: "📈",
    icon: TrendingUpOutlined,
  },
  Amber: {
    color: WARNING_COLORS.Amber,
    onColor: ON_STATUS_COLORS.amber,
    emoji: "⚠️",
    icon: WarningAmberOutlined,
  },
  Red: {
    color: WARNING_COLORS.Red,
    onColor: ON_STATUS_COLORS.red,
    emoji: "🚨",
    icon: CrisisAlert,
  },
  "No Paddling": {
    color: STATUS_COLORS.maroon,
    onColor: ON_STATUS_COLORS.maroon,
    emoji: "⛔",
    icon: DoNotDisturbOutlined,
  },
};

// --- RAG Calculation Criteria ---
// Adjust these thresholds based on your local safety guidelines
// Each row is the club's conditions table: temperature band, then weather,
// then one rating per river-level column.
//
// `low.rainy` is the one entry with no row in the printed table, which lists
// only calm and windy at 5°C and below. It used to copy `low.calm`, so rain
// raised the rating at 8°C and did nothing at 3°C - backwards, since cold rain
// is worse than cool rain. It now matches `low.windy`, the same pairing the
// 5-12°C band already makes between wind and rain. That is deliberately
// stricter than the printed rules; the Conditions Key says so.
export const CRITERIA_TABLE: {
  [key: string]: { [key: string]: number[] };
} = {
  high: { calm: [0, 1, 2, 3], windy: [1, 2, 2, 3] },
  moderate: { calm: [1, 2, 2, 3], windy: [2, 2, 2, 3], rainy: [2, 2, 2, 3] },
  low: { calm: [2, 2, 3, 3], windy: [2, 3, 3, 3], rainy: [2, 3, 3, 3] },
};

export const THRESHOLDS = {
  TEMP_HIGH: 13,
  TEMP_MODERATE: 5,
  WIND_HIGH: 15,
  // Gusts above this are called out as a heads-up (not fed into the RAG
  // calculation itself, which only reacts to sustained wind speed).
  WIND_GUST_NOTABLE: 15,
  VISIBILITY_POOR: 1000,
  RIVER_LEVEL_NO_PADDLING: 5.0,
  THUNDERSTORM_CODES: [95, 96, 97, 98, 99],
  FOG_CODES: [40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
  RIVER_LEVEL_INITIAL_RAG_1: 1.0,
  // Above this, the concrete step landmark is submerged and PFDs are required.
  RIVER_LEVEL_INITIAL_RAG_2: 1.48,
  // Above this, the river is above the 10th step from the car park - no paddling for intermediates.
  RIVER_LEVEL_INITIAL_RAG_3: 2.75,
  RIVER_LEVEL_TREND_THRESHOLD: 0.1,
  // A forecast hour counts as dark - and takes the "Dark" step - when more
  // than this fraction of it falls before sunrise or after sunset. A quarter,
  // so an hour only counts as light when at least three quarters of it is:
  // more than 15 minutes of dark in an hour makes it a dark hour.
  DARK_HOUR_FRACTION: 0.25,
};

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

// --- Conditions Key Descriptions ---
// These appear in the Settings drawer "Conditions Key" section.
// Update them to describe your own venue's landmarks and club guidelines.

export const RAG_DESCRIPTIONS: Record<Status, string> = {
  "Light Green":
    "Ideal conditions. Beginners need coach supervision. Improvers may paddle as a group without a coach. Intermediates may paddle solo.",
  "Dark Green":
    "Good conditions. Beginners and improvers need coach supervision. Intermediates may paddle with at least one other intermediate.",
  Amber:
    "Coach's discretion required. Beginners and improvers may only paddle at coach's discretion. Intermediates need supervision by an independent paddler or coach.",
  Red: "Risky conditions. No paddling for beginners or improvers. Intermediates at coach's discretion only (not above 10 steps from car park). PFDs must be worn by all.",
  "No Paddling":
    "Do not paddle. Triggered by thunderstorms or dangerously high river level.",
  Unknown: "Data unavailable.",
};

// Descriptions for each river level band in the conditions key.
// Rewrite these to describe your own launch point landmarks.
export const RIVER_LEVEL_BAND_DESCRIPTIONS = {
  belowRag1: "Below the wooden landing stage. Good launch conditions.",
  rag1ToRag2:
    "Between landing stage and concrete step. Still paddleable with care.",
  rag2ToRag3: "Above the concrete step. PFDs must be worn by all.",
  rag3Plus:
    "Above 10 steps from the car park. No paddling for intermediates and below.",
  noPaddling: "Boathouse flooding. No paddling under any circumstances.",
};

// --- UI Text and Icons ---
export const REASON_ICONS: Record<string, React.ElementType> = {
  [`Slightly elevated river level (> ${formatRiverLevel(THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_1)})`]:
    Water,
  [`Moderately elevated river level (> ${formatRiverLevel(THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_2)})`]:
    Waves,
  [`Significantly elevated river level (> ${formatRiverLevel(THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_3)})`]:
    Tsunami,
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

// Descriptions of river levels at specific local landmarks.
// The key is the river level in metres as read from your gauge station.
// Build this list by visiting your venue at different water levels and
// recording the gauge reading alongside what you observe (e.g. "water over
// the bottom step", "launching from grass verge"). You can leave this empty
// if you don't have location-specific observations yet.
export const LEVEL_DESCRIPTIONS: Record<number, string> = {
  1.0: "Able to launch from the landing stage – OK",
  1.15: "Water over one end of the landing stage",
  1.38: "10cm over landing stage, able to launch OK",
  1.48: "On concrete lower deck – wet feet!",
  1.52: "+5cm concrete lower deck, not deep enough – still wet feet!",
  1.68: "+10cm concrete lower deck, deep enough for boat to float – dry feet!",
  1.96: "Bollards submerged, launch with care – rudder may still ground on the step even once the boat floats",
  2.12: "Half way up steps – have to portage around the lock at Diglis",
  2.52: "11-12 steps below the car park visible – approaching the 10-step Red threshold",
  2.75: "10th step wet, wet feet possible",
  4.28: "Almost on the car park – dry feet!",
  4.37: "5cm on the car park – not deep enough for boats, wet feet!",
  4.49: "Water on car park, safe to park only if falling",
  4.7: "Just in the boat house!!",
  5.01: "Boathouse flooding – paddle with extreme care",
  5.02: "Deep water in boathouse, boats can float out – paddle with extreme care",
  5.18: "Grand Stand Road flooded, unsafe to access boathouse",
  5.34: "Water over the lower boat racks – boats at risk of damage",
  5.54: "Sabrina Bridge closed, North Parade underwater, dangerous flows",
  5.55: "Boathouse inaccessible, dangerous flow, no paddling advised",
};

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
// /api/conditions is cached for CONDITIONS_REVALIDATE_SECONDS, and once that
// window is up the cache hands the *expired* entry to whoever arrives first
// and regenerates behind them (stale-while-revalidate). So a payload older
// than the window is proof the cache turned over on this very request: the
// data on screen is last cycle's, and the fresh copy only lands for whoever
// asks next. That threshold therefore has to sit just above the window - a
// value set to some multiple of it (this was 30 minutes against a 15-minute
// window) leaves a band where data is stale by the server's own contract yet
// the client accepts it as fresh, so the live re-fetch never fires and the
// "whoever asks next" that finally gets the regenerated data is the user
// tapping refresh by hand.
//
// The grace on top absorbs regeneration latency and device clock skew, since
// fetchedAt is stamped by the server clock and compared against the phone's.
const STALE_GRACE_MS = 2 * 60 * 1000;
// Data older than this forces a live re-fetch (see /api/conditions/live)
// rather than waiting on background revalidation, and - if that re-fetch
// can't get through either - is flagged as stale in the UI.
export const DATA_STALE_THRESHOLD_MS =
  CONDITIONS_REVALIDATE_SECONDS * 1000 + STALE_GRACE_MS;

// --- AI Summary ---
export const DEFAULT_AI_MODEL = "openai/gpt-oss-120b";
// Models /api/briefing will accept from the client. Anything else falls back
// to DEFAULT_AI_MODEL so visitors can't run arbitrary models on our API key.
export const ALLOWED_AI_MODELS = [DEFAULT_AI_MODEL];

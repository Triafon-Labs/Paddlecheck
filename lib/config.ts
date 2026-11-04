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
import {
  ForecastSource,
  PaddlerType,
  PaddlingExtraRule,
  PaddlingVerdict,
  Status,
} from "@/types";
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
// Shown above "Paddlecheck" in the top bar, so it has to fit beside three
// buttons on a phone: about 20 characters before it's cut short. Use an
// abbreviation if your club's name is longer (e.g. "Worcester CC").
export const CLUB_SHORT_NAME = "Worcester Canoe Club";
// Where the "Feedback welcome" link in the Settings drawer goes. Any URL
// works - an issue tracker, a form, or a mailto: link.
export const FEEDBACK_URL = "https://github.com/dylanr97/Paddlecheck/issues";

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
// UPSTREAM_TRAVEL_HOURS to estimate when a flood wave will arrive.
// CSV URLs follow the pattern: https://check-for-flooding.service.gov.uk/station-csv/<station-id>
// Only stations with an EA forecast publish the three-column CSV
// (timestamp, height, observed/forecast) this needs - see README.md.
// Set to null if you don't have a useful upstream station: the forecast then
// continues your own gauge's recent trend instead.
export const UPSTREAM_CSV_URL: string | null =
  "https://check-for-flooding.service.gov.uk/station-csv/2001";
export const UPSTREAM_TRAVEL_HOURS = 6;

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

// --- Met Office Weather Warnings ---
// The regional RSS feed, and the area name a warning's description must
// mention to be shown. Feed URLs for every region are listed at
// https://www.metoffice.gov.uk/weather/guides/rss
export const MET_OFFICE_WARNINGS_RSS_URL =
  "https://www.metoffice.gov.uk/public/data/PWSCache/WarningsRSS/Region/wm";
export const WARNING_AREA = "Worcestershire";

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

// How each status step looks. The keys are fixed step names the code uses
// internally - the five steps from best to worst, plus Unknown. Everything a
// visitor sees comes from here:
//   `label`   - the name shown for the step (rename them to your club's terms,
//               e.g. "Low", "Moderate", "High", "Severe")
//   `color`   - the step's colour; `onColor` the text colour on top of it.
//               Keep the pairs from lib/statusColors.ts, which are checked for
//               contrast (e.g. STATUS_COLORS.yellow with ON_STATUS_COLORS.yellow).
//   `emoji` / `icon` - used in the share text and on the status panel.
// The worst step ("No Paddling") is also what thunderstorms give if
// RULES.THUNDERSTORMS is on, so give it a label that fits both. What each
// paddler level may do on each step is set in lib/paddlingMatrix.ts.
export const RAG_STATUS_UI: Record<
  Status,
  {
    label: string;
    color: string;
    onColor: string;
    emoji: string;
    icon: React.ElementType;
  }
> = {
  Unknown: {
    label: "Unknown",
    color: STATUS_COLORS.grey,
    onColor: ON_STATUS_COLORS.grey,
    emoji: "🤷",
    icon: HelpOutlined,
  },
  "Light Green": {
    label: "Light Green",
    color: STATUS_COLORS.lightGreen,
    onColor: ON_STATUS_COLORS.lightGreen,
    emoji: "✅",
    icon: Check,
  },
  "Dark Green": {
    label: "Dark Green",
    color: STATUS_COLORS.darkGreen,
    onColor: ON_STATUS_COLORS.darkGreen,
    emoji: "📈",
    icon: TrendingUpOutlined,
  },
  Amber: {
    label: "Amber",
    color: WARNING_COLORS.Amber,
    onColor: ON_STATUS_COLORS.amber,
    emoji: "⚠️",
    icon: WarningAmberOutlined,
  },
  Red: {
    label: "Red",
    color: WARNING_COLORS.Red,
    onColor: ON_STATUS_COLORS.red,
    emoji: "🚨",
    icon: CrisisAlert,
  },
  "No Paddling": {
    label: "No Paddling",
    color: STATUS_COLORS.maroon,
    onColor: ON_STATUS_COLORS.maroon,
    emoji: "⛔",
    icon: DoNotDisturbOutlined,
  },
};

// --- Which rules apply ---
// Switch off any factor your club's rules don't use.
export const RULES = {
  // Temperature, wind and rain adjust the river level's status through
  // CRITERIA_TABLE below. Off: the river level alone sets the status, before
  // the factors that follow.
  WEATHER_TABLE: true,
  // Darkness raises the status one step (e.g. Dark Green -> Amber).
  DARKNESS: true,
  // Fog or poor visibility raises the status one step.
  FOG: true,
  // Thunderstorms move straight to the worst step, overriding everything.
  THUNDERSTORMS: true,
};

// --- Paddler levels ---
// The levels offered in Settings and shown in "Who Can Paddle", in order from
// least to most experienced. What each may do is in lib/paddlingMatrix.ts -
// change the names here and TypeScript will point at every rule in that file
// that still uses an old one.
export const PADDLER_LEVELS = [
  "Beginner",
  "Improver",
  "Intermediate",
  "Independent",
] as const;

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
  // Gusts at or above this are mentioned in the share text and the AI
  // briefing's forecast summary (lib/forecast.ts). Never fed into the RAG
  // calculation, which only reacts to sustained wind speed.
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

// --- Who can paddle ---
// What each paddler level (PADDLER_LEVELS) may do on each status step, shown
// under "Who Can Paddle" and for each forecast hour. A verdict is one of:
//   "Yes"        - "Can paddle"
//   "Warning"    - "With caveats" (can paddle, read the details)
//   "Discretion" - "Coach's discretion"
//   "No"         - "Cannot paddle"
// `details` are the lines shown under it. A step can give one verdict for
// every level, or one per level - in which case every level must be listed.
const SABRINA_SLIP = "Stay between Sabrina Bridge and the Slip";
const COACH_AND_PFD = "Coach supervision and PFD required";

export const WHO_CAN_PADDLE: Record<
  Status,
  PaddlingVerdict | Record<PaddlerType, PaddlingVerdict>
> = {
  "Light Green": {
    Beginner: { verdict: "Warning", details: [COACH_AND_PFD] },
    Improver: {
      verdict: "Warning",
      details: [
        "No coach needed, but paddle with at least one other improver or intermediate (preferably more)",
        "Someone in the group carries a mobile phone",
        "Familiar boat only",
        SABRINA_SLIP,
        "PFD required",
      ],
    },
    Intermediate: {
      verdict: "Yes",
      details: [
        "May paddle solo",
        "Carry a mobile phone",
        "Familiar boat only",
        SABRINA_SLIP,
        "PFD required",
      ],
    },
    Independent: { verdict: "Yes" },
  },
  "Dark Green": {
    Beginner: { verdict: "Warning", details: [COACH_AND_PFD] },
    Improver: { verdict: "Warning", details: [COACH_AND_PFD] },
    Intermediate: {
      verdict: "Warning",
      details: [
        "Pair up with another intermediate, no coach needed",
        "Solo K2 crews must be able to self-rescue",
        "Carry a mobile phone",
        "Familiar boat only",
        SABRINA_SLIP,
        "PFD required",
      ],
    },
    Independent: { verdict: "Yes" },
  },
  Amber: {
    Beginner: { verdict: "Discretion", details: ["PFD required"] },
    Improver: { verdict: "Discretion", details: ["PFD required"] },
    // The rules allow this outright with supervision - "In AMBER conditions
    // they can be supervised by an Independent paddler or club coach" -
    // rather than leaving it to a coach's discretion.
    Intermediate: {
      verdict: "Warning",
      details: [
        "Must be supervised by an independent paddler or club coach",
        "PFD required",
      ],
    },
    Independent: {
      verdict: "Yes",
      details: [
        "May supervise intermediates",
        "PFD required above the concrete step",
      ],
    },
  },
  Red: {
    Beginner: { verdict: "No" },
    Improver: { verdict: "No" },
    // Above the 10th step this becomes a "No" - see WHO_CAN_PADDLE_EXTRAS.
    Intermediate: { verdict: "Discretion", details: ["PFD required"] },
    Independent: {
      verdict: "Warning",
      details: ["Avoid paddling alone, PFD required"],
    },
  },
  "No Paddling": {
    verdict: "No",
    details: ["Applies to every level, independents included"],
  },
  Unknown: {
    verdict: "No",
    details: ["Conditions could not be checked", "Ask a coach before paddling"],
  },
};

// Rules applied on top of WHO_CAN_PADDLE, in order - for anything that
// depends on the river level rather than the status, or that adds the same
// line across several steps. Apart from `set`, they leave a "No" alone.
// Leave the list empty if the table says everything.
export const WHO_CAN_PADDLE_EXTRAS: PaddlingExtraRule[] = [
  {
    // "No paddling for intermediates above 10 steps from the car park" holds
    // however the status got to Red, so it's keyed to the level itself.
    when: {
      status: ["Red"],
      riverLevelAtLeast: THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_3,
    },
    levels: ["Intermediate"],
    set: {
      verdict: "No",
      details: ["No paddling above 10 steps from the car park"],
    },
  },
  {
    // PFDs above the concrete step, even when the weather keeps the status
    // below Red (whose own lines already require one).
    when: {
      notStatus: ["Red"],
      riverLevelAtLeast: THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_2,
    },
    levels: ["Independent", "Intermediate"],
    yesBecomes: "Warning",
    addDetail: "PFD required – river is high",
    replacing: "PFD required",
  },
  {
    // From the club email introducing bibs: "All coaching groups of Adult and
    // Junior Beginners and Intermediate paddlers will wear luminous bibs."
    // Improvers and non-coaching groups are included too - deliberately wider
    // than the email, since a bib costs nothing.
    levels: ["Beginner", "Improver", "Intermediate"],
    addDetail: "Wear a luminous bib",
  },
];

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

// The weather half of the conditions key. The headings and figures (e.g.
// "Below 15 mph") come from THRESHOLDS; this is the explanation beside each.
// Rows for a factor switched off in RULES aren't shown.
export const CONDITIONS_KEY_WEATHER = {
  tempWarm: "Warm. No temperature penalty applied.",
  tempCool: "Cool. Raises the base risk rating. Rain also becomes a factor.",
  tempCold:
    "Cold air, and likely cold water too - capsizing is far more dangerous with nowhere warm to recover. Significant increase in risk rating.",
  windCalm: "Calm. No wind penalty applied.",
  windHigh: "Windy. Raises the risk rating at all temperatures.",
  rainCool:
    "Rain raises the risk rating whenever it isn't warm, by the same step as windy conditions.",
  // Shown only when set. Worcester's printed table doesn't cover cold rain.
  rainCold: `The club's printed table sets out rain only for the cool band, listing just calm and windy at ${THRESHOLDS.TEMP_MODERATE}°C and below. Paddlecheck treats cold rain like cold wind rather than ignoring it, so it is stricter than the printed rules here.`,
  rainWarm: "Rain doesn't count against the rating once it's this warm.",
  // The club's rules define dark as streetlights lit; the app can't see
  // streetlights, so it uses sunrise and sunset.
  dark: `Streetlights lit, in the club's rules. Paddlecheck uses sunrise and sunset in its place, and counts a forecast hour as dark when over ${60 * THRESHOLDS.DARK_HOUR_FRACTION} minutes of it is. Raises the rating one step.`,
  fog: "Raises the rating one step.",
  thunderstorm:
    "No paddling when thunder is near – overrides all other conditions.",
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

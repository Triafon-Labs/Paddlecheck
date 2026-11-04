import {
  Check,
  TrendingUpOutlined,
  WarningAmberOutlined,
  CrisisAlert,
  DoNotDisturbOutlined,
  HelpOutlined,
  Water,
  Waves,
  Tsunami,
  Flood,
} from "@mui/icons-material";
import type { ElementType } from "react";
import rawClub from "@/club.yaml";
import { STATUS_COLORS, ON_STATUS_COLORS } from "./statusColors";
import type {
  PaddlingExtraRule,
  PaddlingStatusValue,
  PaddlingVerdict,
  StatusStep,
} from "@/types";

// Reads club.yaml - every club-specific setting - checks it, and turns it
// into the shapes lib/config.ts exports. A mistake stops `npm run dev` and
// `npm run build` with a message naming the setting, rather than showing a
// wrong status on the day.

// The icon names club.yaml may use.
export const ICONS: Record<string, ElementType> = {
  check: Check,
  trendingUp: TrendingUpOutlined,
  warning: WarningAmberOutlined,
  alert: CrisisAlert,
  stop: DoNotDisturbOutlined,
  help: HelpOutlined,
  water: Water,
  waves: Waves,
  tsunami: Tsunami,
  flood: Flood,
};

const COLOURS = Object.keys(STATUS_COLORS) as (keyof typeof STATUS_COLORS)[];
const VERDICTS: PaddlingStatusValue[] = ["Yes", "Warning", "Discretion", "No"];

export interface ClubConfig {
  appName: string;
  club: {
    name: string;
    shortName: string;
    feedbackUrl: string;
    usefulLinks: { name: string; url: string }[];
  };
  latitude: number;
  longitude: number;
  river: {
    stationId: string;
    forecastCsv: string | null;
    travelHours: number;
  };
  warnings: { feed: string; area: string };
  rules: {
    weatherTable: boolean;
    darkness: boolean;
    fog: boolean;
    thunderstorms: boolean;
  };
  thresholds: {
    tempHigh: number;
    tempModerate: number;
    windHigh: number;
    visibilityPoor: number;
    darkHourFraction: number;
  };
  steps: StatusStep[];
  weatherTable: Record<string, Record<string, number[]>>;
  paddlerLevels: string[];
  whoCanPaddle: Record<
    string,
    PaddlingVerdict | Record<string, PaddlingVerdict>
  >;
  whoCanPaddleExtras: PaddlingExtraRule[];
  landmarks: Record<number, string>;
  conditionsKey: {
    tempWarm: string;
    tempCool: string;
    tempCold: string;
    windCalm: string;
    windHigh: string;
    rainCool: string;
    rainCold: string;
    rainWarm: string;
    dark: string;
    fog: string;
    thunderstorm: string;
  };
}

const DEFAULT_UNKNOWN_VERDICT: PaddlingVerdict = {
  verdict: "No",
  details: ["Conditions could not be checked", "Ask a coach before paddling"],
};

// --- A small checker that collects every problem before giving up ---

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const problems: string[] = [];
// A section that's missing altogether is reported once, not once for every
// setting inside it.
const missingSections: string[] = [];
const problem = (path: string, message: string) => {
  if (missingSections.some((section) => path.startsWith(`${section} → `)))
    return;
  problems.push(`${path}: ${message}`);
};

const show = (v: unknown) => (v === undefined ? "nothing" : JSON.stringify(v));

const obj = (v: unknown, path: string): Obj => {
  if (isObj(v)) return v;
  if (v === undefined) {
    problem(path, "missing");
    missingSections.push(path);
  } else problem(path, `expected a section of settings, found ${show(v)}`);
  return {};
};

// Flags settings this file doesn't know - usually a typo, such as "color"
// for "colour", which would otherwise be silently ignored.
const known = (o: Obj, keys: string[], path: string) => {
  for (const key of Object.keys(o)) {
    if (!keys.includes(key))
      problem(
        path === "club.yaml" ? key : `${path} → ${key}`,
        `isn't a setting here. Expected: ${keys.join(", ")}`
      );
  }
};

const str = (v: unknown, path: string, allowEmpty = false): string => {
  if (typeof v === "string" && (allowEmpty || v.trim() !== "")) return v;
  // YAML reads 2642 or 1.0 as numbers; they're fine as text too.
  if (typeof v === "number") return String(v);
  problem(path, `expected some text, found ${show(v)}`);
  return "";
};

const num = (v: unknown, path: string): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  problem(path, `expected a number, found ${show(v)}`);
  return 0;
};

const bool = (v: unknown, path: string): boolean => {
  if (typeof v === "boolean") return v;
  problem(path, `expected true or false, found ${show(v)}`);
  return false;
};

const list = (v: unknown, path: string): unknown[] => {
  if (Array.isArray(v)) return v;
  problem(path, `expected a list, found ${show(v)}`);
  return [];
};

const oneOf = <T extends string>(
  v: unknown,
  options: readonly T[],
  path: string
): T => {
  if (typeof v === "string" && (options as readonly string[]).includes(v))
    return v as T;
  // YAML 1.1 tools read an unquoted No/Yes as false/true.
  if (v === false && options.includes("No" as T)) return "No" as T;
  if (v === true && options.includes("Yes" as T)) return "Yes" as T;
  problem(
    path,
    v === undefined
      ? `missing – use one of: ${options.join(", ")}`
      : `${show(v)} isn't one of: ${options.join(", ")}`
  );
  return options[0];
};

const strList = (v: unknown, path: string): string[] =>
  list(v, path).map((item, i) => str(item, `${path}[${i + 1}]`));

// --- The sections ---

const verdict = (v: unknown, path: string): PaddlingVerdict => {
  const o = obj(v, path);
  known(o, ["verdict", "details"], path);
  const out: PaddlingVerdict = {
    verdict: oneOf(o.verdict, VERDICTS, `${path} → verdict`),
  };
  if (o.details !== undefined)
    out.details = strList(o.details, `${path} → details`);
  return out;
};

const parseSteps = (v: unknown): StatusStep[] => {
  const steps = list(v, "steps").map((raw, i) => {
    const o = obj(raw, `steps[${i + 1}]`);
    const name = str(o.name, `steps[${i + 1}] → name`);
    const at = `steps → "${name || i + 1}"`;
    known(
      o,
      [
        "name",
        "fromLevel",
        "colour",
        "icon",
        "emoji",
        "description",
        "riverDescription",
        "riverReason",
        "reasonIcon",
        "bestTimes",
      ],
      at
    );
    const colour = oneOf(o.colour, COLOURS, `${at} → colour`);
    const iconName = oneOf(o.icon, Object.keys(ICONS), `${at} → icon`);
    const step: StatusStep = {
      name,
      fromLevel: num(o.fromLevel, `${at} → fromLevel`),
      color: STATUS_COLORS[colour],
      onColor: ON_STATUS_COLORS[colour],
      emoji: str(o.emoji, `${at} → emoji`),
      icon: ICONS[iconName],
      description: str(o.description, `${at} → description`),
      riverDescription: str(o.riverDescription, `${at} → riverDescription`),
    };
    if (o.riverReason !== undefined)
      step.riverReason = str(o.riverReason, `${at} → riverReason`);
    if (o.reasonIcon !== undefined)
      step.reasonIcon =
        ICONS[oneOf(o.reasonIcon, Object.keys(ICONS), `${at} → reasonIcon`)];
    if (o.bestTimes !== undefined)
      step.bestTimes = bool(o.bestTimes, `${at} → bestTimes`);
    return step;
  });

  if (steps.length < 2) problem("steps", "needs at least two steps");
  if (steps[0] && steps[0].fromLevel !== 0)
    problem(
      `steps → "${steps[0].name}"`,
      "the first step must have fromLevel: 0"
    );
  steps.forEach((step, i) => {
    if (i > 0 && !(step.fromLevel > steps[i - 1].fromLevel))
      problem(
        `steps → "${step.name}"`,
        `fromLevel must be higher than "${steps[i - 1].name}" (${steps[i - 1].fromLevel})`
      );
    if (i > 0 && i < steps.length - 1 && !step.riverReason)
      problem(`steps → "${step.name}"`, "needs a riverReason");
  });
  const names = steps.map((s) => s.name);
  names.forEach((n, i) => {
    if (names.indexOf(n) !== i) problem("steps", `"${n}" appears twice`);
    if (n === "Unknown")
      problem("steps", `"Unknown" is reserved for missing data`);
  });
  return steps;
};

const parseWeatherTable = (
  v: unknown,
  steps: StatusStep[],
  enabled: boolean
): Record<string, Record<string, number[]>> => {
  if (!enabled && v === undefined) return {};
  const table = obj(v, "weatherTable");
  const out: Record<string, Record<string, number[]>> = {};
  const columns = steps.length - 1;
  const bands: Record<string, string[]> = {
    high: ["calm", "windy"],
    moderate: ["calm", "windy", "rainy"],
    low: ["calm", "windy", "rainy"],
  };
  for (const [band, weathers] of Object.entries(bands)) {
    const row = obj(table[band], `weatherTable → ${band}`);
    out[band] = {};
    for (const weather of weathers) {
      const at = `weatherTable → ${band} → ${weather}`;
      if (row[weather] === undefined) {
        problem(at, "missing");
        continue;
      }
      const results = list(row[weather], at).map((n, i) =>
        num(n, `${at}[${i + 1}]`)
      );
      if (results.length !== columns)
        problem(
          at,
          `has ${results.length} entries – it needs one per step except the last (${columns})`
        );
      if (results.some((n) => !Number.isInteger(n) || n < 0 || n >= columns))
        problem(
          at,
          `every entry must be a step number from 0 to ${columns - 1}`
        );
      out[band][weather] = results;
    }
  }
  return out;
};

const parseWhoCanPaddle = (
  v: unknown,
  stepNames: string[],
  levels: string[]
) => {
  const o = obj(v, "whoCanPaddle");
  const out: ClubConfig["whoCanPaddle"] = {};
  for (const key of Object.keys(o)) {
    if (key !== "Unknown" && !stepNames.includes(key))
      problem(
        `whoCanPaddle → "${key}"`,
        `isn't a step. Steps are: ${stepNames.join(", ")}`
      );
  }
  for (const name of [...stepNames, "Unknown"]) {
    const at = `whoCanPaddle → "${name}"`;
    const entry = o[name];
    if (entry === undefined) {
      if (name === "Unknown") out.Unknown = DEFAULT_UNKNOWN_VERDICT;
      else problem(at, "missing – every step needs an entry");
      continue;
    }
    if (isObj(entry) && "verdict" in entry) {
      out[name] = verdict(entry, at);
      continue;
    }
    const perLevel = obj(entry, at);
    const verdicts: Record<string, PaddlingVerdict> = {};
    for (const key of Object.keys(perLevel)) {
      if (!levels.includes(key))
        problem(
          `${at} → "${key}"`,
          `isn't a paddler level. Levels are: ${levels.join(", ")}`
        );
    }
    for (const level of levels) {
      if (perLevel[level] === undefined)
        problem(
          at,
          `"${level}" is missing – give one verdict for everyone, or one for every level`
        );
      else verdicts[level] = verdict(perLevel[level], `${at} → "${level}"`);
    }
    out[name] = verdicts;
  }
  return out;
};

const parseExtras = (
  v: unknown,
  stepNames: string[],
  levels: string[]
): PaddlingExtraRule[] =>
  list(v ?? [], "whoCanPaddleExtras").map((raw, i) => {
    const at = `whoCanPaddleExtras[${i + 1}]`;
    const o = obj(raw, at);
    known(
      o,
      ["when", "levels", "set", "yesBecomes", "addDetail", "replacing"],
      at
    );
    const stepList = (x: unknown, p: string) =>
      strList(x, p).map((s) => {
        if (!stepNames.includes(s)) problem(p, `"${s}" isn't a step`);
        return s;
      });
    const rule: PaddlingExtraRule = {
      levels: strList(o.levels, `${at} → levels`).map((l) => {
        if (!levels.includes(l))
          problem(`${at} → levels`, `"${l}" isn't a paddler level`);
        return l;
      }),
    };
    if (o.when !== undefined) {
      const w = obj(o.when, `${at} → when`);
      known(w, ["status", "notStatus", "riverLevelAtLeast"], `${at} → when`);
      rule.when = {};
      if (w.status !== undefined)
        rule.when.status = stepList(w.status, `${at} → when → status`);
      if (w.notStatus !== undefined)
        rule.when.notStatus = stepList(w.notStatus, `${at} → when → notStatus`);
      if (w.riverLevelAtLeast !== undefined)
        rule.when.riverLevelAtLeast = num(
          w.riverLevelAtLeast,
          `${at} → when → riverLevelAtLeast`
        );
    }
    if (o.set !== undefined) rule.set = verdict(o.set, `${at} → set`);
    if (o.yesBecomes !== undefined)
      rule.yesBecomes = oneOf(o.yesBecomes, VERDICTS, `${at} → yesBecomes`);
    if (o.addDetail !== undefined)
      rule.addDetail = str(o.addDetail, `${at} → addDetail`);
    if (o.replacing !== undefined)
      rule.replacing = str(o.replacing, `${at} → replacing`);
    if (!rule.set && !rule.yesBecomes && !rule.addDetail)
      problem(at, "does nothing – give it set, yesBecomes or addDetail");
    return rule;
  });

const parseLandmarks = (v: unknown): Record<number, string> => {
  const o = obj(v ?? {}, "landmarks");
  const out: Record<number, string> = {};
  for (const [key, text] of Object.entries(o)) {
    const level = Number(key);
    if (!Number.isFinite(level))
      problem(
        `landmarks → ${key}`,
        "the key must be a gauge reading in metres"
      );
    else out[level] = str(text, `landmarks → ${key}`);
  }
  return out;
};

const parse = (raw: unknown): ClubConfig => {
  const root = obj(raw, "club.yaml");
  const app = obj(root.app, "app");
  const club = obj(root.club, "club");
  const location = obj(root.location, "location");
  const river = obj(root.river, "river");
  const warnings = obj(root.warnings, "warnings");
  const rules = obj(root.rules, "rules");
  const thresholds = obj(root.thresholds, "thresholds");
  const key = obj(root.conditionsKey, "conditionsKey");
  known(
    root,
    [
      "app",
      "club",
      "location",
      "river",
      "warnings",
      "rules",
      "thresholds",
      "steps",
      "weatherTable",
      "paddlerLevels",
      "whoCanPaddle",
      "whoCanPaddleExtras",
      "landmarks",
      "conditionsKey",
    ],
    "club.yaml"
  );
  known(app, ["name"], "app");
  known(club, ["name", "shortName", "feedbackUrl", "usefulLinks"], "club");
  known(location, ["latitude", "longitude"], "location");
  known(river, ["stationId", "forecastCsv", "travelHours"], "river");
  known(warnings, ["feed", "area"], "warnings");
  known(rules, ["weatherTable", "darkness", "fog", "thunderstorms"], "rules");
  known(
    thresholds,
    [
      "tempHigh",
      "tempModerate",
      "windHigh",
      "visibilityPoor",
      "darkHourFraction",
    ],
    "thresholds"
  );
  known(
    key,
    [
      "tempWarm",
      "tempCool",
      "tempCold",
      "windCalm",
      "windHigh",
      "rainCool",
      "rainCold",
      "rainWarm",
      "dark",
      "fog",
      "thunderstorm",
    ],
    "conditionsKey"
  );

  const appName = str(app.name, "app → name");
  const parsedRules = {
    weatherTable: bool(rules.weatherTable, "rules → weatherTable"),
    darkness: bool(rules.darkness, "rules → darkness"),
    fog: bool(rules.fog, "rules → fog"),
    thunderstorms: bool(rules.thunderstorms, "rules → thunderstorms"),
  };
  const parsedThresholds = {
    tempHigh: num(thresholds.tempHigh, "thresholds → tempHigh"),
    tempModerate: num(thresholds.tempModerate, "thresholds → tempModerate"),
    windHigh: num(thresholds.windHigh, "thresholds → windHigh"),
    visibilityPoor: num(
      thresholds.visibilityPoor,
      "thresholds → visibilityPoor"
    ),
    darkHourFraction: num(
      thresholds.darkHourFraction,
      "thresholds → darkHourFraction"
    ),
  };
  const steps = parseSteps(root.steps);
  const stepNames = steps.map((s) => s.name);
  const paddlerLevels = strList(root.paddlerLevels, "paddlerLevels");
  if (paddlerLevels.length === 0)
    problem("paddlerLevels", "needs at least one level");

  // {appName}, {tempHigh} and friends in the Conditions Key text.
  const fill = (text: string) =>
    text
      .replaceAll("{appName}", appName)
      .replaceAll("{tempHigh}", String(parsedThresholds.tempHigh))
      .replaceAll("{tempModerate}", String(parsedThresholds.tempModerate))
      .replaceAll("{windHigh}", String(parsedThresholds.windHigh))
      .replaceAll(
        "{darkMinutes}",
        String(60 * parsedThresholds.darkHourFraction)
      );
  const keyText = (name: string, allowEmpty = false) =>
    fill(str(key[name], `conditionsKey → ${name}`, allowEmpty));

  const forecastCsv =
    river.forecastCsv === null
      ? null
      : str(river.forecastCsv, "river → forecastCsv");

  return {
    appName,
    club: {
      name: str(club.name, "club → name"),
      shortName: str(club.shortName, "club → shortName"),
      feedbackUrl: str(club.feedbackUrl, "club → feedbackUrl"),
      usefulLinks: list(club.usefulLinks ?? [], "club → usefulLinks").map(
        (l, i) => {
          const o = obj(l, `club → usefulLinks[${i + 1}]`);
          return {
            name: str(o.name, `club → usefulLinks[${i + 1}] → name`),
            url: str(o.url, `club → usefulLinks[${i + 1}] → url`),
          };
        }
      ),
    },
    latitude: num(location.latitude, "location → latitude"),
    longitude: num(location.longitude, "location → longitude"),
    river: {
      stationId: str(river.stationId, "river → stationId"),
      forecastCsv,
      travelHours:
        forecastCsv === null && river.travelHours === undefined
          ? 0
          : num(river.travelHours, "river → travelHours"),
    },
    warnings: {
      feed: str(warnings.feed, "warnings → feed"),
      area: str(warnings.area, "warnings → area"),
    },
    rules: parsedRules,
    thresholds: parsedThresholds,
    steps,
    weatherTable: parseWeatherTable(
      root.weatherTable,
      steps,
      parsedRules.weatherTable
    ),
    paddlerLevels,
    whoCanPaddle: parseWhoCanPaddle(
      root.whoCanPaddle,
      stepNames,
      paddlerLevels
    ),
    whoCanPaddleExtras: parseExtras(
      root.whoCanPaddleExtras,
      stepNames,
      paddlerLevels
    ),
    landmarks: parseLandmarks(root.landmarks),
    conditionsKey: {
      tempWarm: keyText("tempWarm"),
      tempCool: keyText("tempCool"),
      tempCold: keyText("tempCold"),
      windCalm: keyText("windCalm"),
      windHigh: keyText("windHigh"),
      rainCool: keyText("rainCool"),
      rainCold: keyText("rainCold", true),
      rainWarm: keyText("rainWarm"),
      dark: keyText("dark"),
      fog: keyText("fog"),
      thunderstorm: keyText("thunderstorm"),
    },
  };
};

// Exported for checking a club.yaml other than the one built in.
export const parseClubConfig = (raw: unknown): ClubConfig => {
  problems.length = 0;
  missingSections.length = 0;
  const config = parse(raw);
  if (problems.length > 0) {
    throw new Error(
      `club.yaml has ${problems.length === 1 ? "a problem" : `${problems.length} problems`}:\n` +
        problems.map((p) => `  • ${p}`).join("\n")
    );
  }
  return config;
};

export const CLUB: ClubConfig = parseClubConfig(rawClub);

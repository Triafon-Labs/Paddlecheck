import Groq from "groq-sdk";
import { KayakConditions } from "@/types";
import { degreesToCompass } from "@/lib/weather";
import {
  londonNow,
  isWarningActiveNow,
  formatWarningTime,
} from "@/lib/warnings";
import {
  THRESHOLDS,
  VISIBILITY_DESCRIPTIONS,
  DEFAULT_AI_MODEL,
  ALLOWED_AI_MODELS,
} from "@/lib/config";
import {
  formatRiverLevel,
  formatTemperature,
  formatWindSpeed,
} from "@/lib/units";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Outlook {
  dayLabel: string;
  rangesText: string;
}

interface SummaryRequest {
  conditions: KayakConditions;
  hourlyForecast?: string | null;
  currentlyDark?: boolean;
  currentTime?: string;
  model?: string;
  // The daylight window the summary covers: "the rest of today", or - when
  // it's already dark - "later today" or "tomorrow".
  period?: string | null;
  outlook?: Outlook | null;
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const BRIEFING_PROMPT = `\
You are writing a short summary of river and weather conditions for members of a kayaking club on the River Severn at Worcester, in the style of a weather app's AI summary (e.g. "Pleasant, partly cloudy morning, and it will stay mild throughout the day.").

Write up to three short, natural sentences summarising conditions across the period the data names ("Period to summarise"): the rest of today, or, if it's currently dark, the next daylight window - later today or tomorrow.

Unless that period is the rest of today, your first sentence must open by naming it: "Tomorrow, the river stays low...", "Later today...". Every figure and time of day you then mention (morning, mid-afternoon, evening) belongs to that period, so the reader is never left working out which day they apply to - "levels stay low, around 0.33 m in the morning" is wrong when the morning in question is tomorrow's. Naming the period once at the start is enough; don't repeat it in every sentence.

Ground it in conditions at the start of that period (or right now, if summarising today), then say how they trend if they change - e.g. "breezy at the moment, easing off later", "the river is around 0.80 m, rising towards 1.50 m by evening", or "temperatures reaching up to 22.1°C by mid-afternoon" (a single peak figure, not a range). Pick the one or two most notable factors (wind, rain, river level, temperature) and genuinely leave the others out - every figure is already shown elsewhere in the app, so nothing is lost. If a second point earns its place, give it its own short sentence rather than chaining clauses with commas or semicolons. Don't enumerate individual hours. Ensure the sentences flow naturally together.

When referring to wind direction, use natural British English phrasing (e.g. "a southerly wind", "a south-westerly breeze", or "wind from the south-west"). Never use repetitive or garbled directional phrases such as "a south south wind" or "south south-westerly".

Quote figures exactly as the data writes them - "36.3°C", "0.33 m", "12.3 mph" - spacing included: no space before °C, a space before m and mph. Never soften a figure into a vague band: "mid-30s", "the high teens", "around 30-odd degrees" are all wrong, and a band with a unit attached ("mid-30s°C") doubly so. A figure not worth stating precisely is better left out than blurred.

Only mention a weather warning if it's one of the official Met Office warnings supplied in the data and it's active or upcoming in the period you're summarising. Each warning is labelled "(currently active)" or "(upcoming - not yet in force)" - trust that label rather than working out timing from the dates yourself, and if it's upcoming, make that clear rather than implying it applies right now. Every warning supplied falls in the period you're summarising, so time it against that period - "an amber heat warning comes into force tomorrow morning", never by weekday ("from Thursday morning"), which sounds like a different day again.

Don't pass verdicts on whether or where to paddle ("a great day for a paddle") - the app's status rating covers that.

Write only the summary - no headings, labels, or quote marks. Use British English (mild, favourable, metres) and a friendly, accessible tone for members ranging from beginners to experienced paddlers.`;

// ── Helpers ───────────────────────────────────────────────────────────────────

// Spelled-out compass directions: the model garbles bare abbreviations when
// turning them into prose ("west-westerly"), so hand it the words instead.
const COMPASS_WORDS: Record<string, string> = {
  N: "north",
  NE: "north-east",
  E: "east",
  SE: "south-east",
  S: "south",
  SW: "south-west",
  W: "west",
  NW: "north-west",
};

function buildConditionsParts(req: SummaryRequest): string {
  const {
    conditions,
    hourlyForecast,
    currentlyDark,
    currentTime,
    period,
    outlook,
  } = req;

  const compass =
    conditions.windDirection !== undefined
      ? degreesToCompass(conditions.windDirection)
      : null;
  const windDir = compass ? (COMPASS_WORDS[compass] ?? compass) : null;

  const now = londonNow();
  const weatherWarnings = conditions.warnings?.length
    ? `Met Office weather warnings for Worcestershire:\n${conditions.warnings
        .map((w) => {
          const status = isWarningActiveNow(w, now)
            ? "currently active"
            : "upcoming - not yet in force";
          return `- ${w.severity} ${w.type} (${status}): ${w.headline}. Valid: ${formatWarningTime(w.validFromISO, w.validFrom)} to ${formatWarningTime(w.validToISO, w.validTo)}`;
        })
        .join("\n")}${
        // Every warning here has already been filtered to the day being
        // summarised, so a weekday name only makes it sound like some other day.
        period
          ? `\nAll of these fall within ${period}, so pin a warning's timing to that period rather than naming its weekday.`
          : ""
      }`
    : null;

  // Current-conditions readings (as opposed to forecast/outlook data) only
  // describe right now, so they're omitted entirely when it's dark and the
  // summary is for a future window instead – nothing here would apply.
  const lines: (string | null)[] = [
    currentTime ? `Current time: ${currentTime}` : null,
    period
      ? `Period to summarise: ${period}, daylight hours only. Every forecast figure below falls in this period, so any time of day you mention in the summary refers to it.`
      : null,
    !currentlyDark && conditions.riverLevel !== undefined
      ? `River level: ${formatRiverLevel(conditions.riverLevel)}`
      : null,
    !currentlyDark && conditions.levelChange
      ? (() => {
          const val = conditions.levelChange.value;
          if (Math.abs(val) <= THRESHOLDS.RIVER_LEVEL_TREND_THRESHOLD) {
            return "River trend: steady";
          }
          const trend = val > 0 ? "rising" : "falling";
          return `River trend: ${val >= 0 ? "+" : ""}${formatRiverLevel(val)} over ${conditions.levelChange.period} (${trend})`;
        })()
      : null,
    !currentlyDark && conditions.temperature !== undefined
      ? `Air temperature: ${formatTemperature(conditions.temperature)}`
      : null,
    !currentlyDark && conditions.windSpeed !== undefined
      ? `Wind: ${formatWindSpeed(conditions.windSpeed)}${windDir ? ` from the ${windDir}` : ""}`
      : null,
    !currentlyDark && conditions.rain
      ? `Rain: ${conditions.weatherDescription || "yes"}`
      : null,
    !currentlyDark &&
    conditions.visibilityDescription &&
    conditions.visibility !== undefined &&
    conditions.visibility < VISIBILITY_DESCRIPTIONS.MODERATE.min
      ? `Visibility: ${conditions.visibilityDescription}`
      : null,
    hourlyForecast
      ? `Hour-by-hour forecast for ${period ?? "the summarised daylight window"}:\n${hourlyForecast}`
      : null,
    currentlyDark && outlook
      ? `It is currently dark. The outlook for ${outlook.dayLabel} is: ${outlook.rangesText}.`
      : null,
    currentlyDark && !outlook
      ? `It is currently dark and no daytime forecast is available.`
      : null,
    weatherWarnings,
  ];

  return lines.filter(Boolean).join("\n");
}

/** Strips <think>…</think> blocks from a streaming Groq response. */
async function* stripThinkTags(
  stream: AsyncIterable<{
    choices: Array<{ delta: { content?: string | null } }>;
  }>
): AsyncGenerator<string> {
  let inThink = false;
  let buf = "";

  for await (const chunk of stream) {
    buf += chunk.choices[0]?.delta?.content ?? "";

    let out = "";
    while (buf.length > 0) {
      if (inThink) {
        const end = buf.indexOf("</think>");
        if (end === -1) {
          buf = "";
          break;
        }
        buf = buf.slice(end + 8);
        inThink = false;
      } else {
        const start = buf.indexOf("<think>");
        if (start === -1) {
          out += buf;
          buf = "";
          break;
        }
        out += buf.slice(0, start);
        buf = buf.slice(start + 7);
        inThink = true;
      }
    }

    if (out) yield out;
  }

  if (!inThink && buf) yield buf;
}

// Degrees are written tight against the number ("36.3°C") everywhere else in
// the app, but the model drifts into "36.3 °C" often enough that asking it
// nicely isn't sufficient - so the spacing is closed here regardless.
const DEGREE_SPACE = /(\d)[ \t\u00A0\u202F]*(°)[ \t\u00A0\u202F]*([CF])\b/g;
// A chunk can end part-way through a figure ("36.3 " with "°C" still to come),
// so any tail that could still grow into one waits for the next chunk.
const PARTIAL_DEGREE = /\d[ \t\u00A0\u202F]*(?:°[ \t\u00A0\u202F]*)?$/;

const closeDegreeSpacing = (text: string) =>
  text.replace(DEGREE_SPACE, "$1$2$3");

async function* normaliseUnits(
  stream: AsyncIterable<string>
): AsyncGenerator<string> {
  let held = "";

  for await (const chunk of stream) {
    const buf = held + chunk;
    const partial = PARTIAL_DEGREE.exec(buf);
    const cut = partial ? partial.index : buf.length;
    held = buf.slice(cut);

    const out = closeDegreeSpacing(buf.slice(0, cut));
    if (out) yield out;
  }

  if (held) yield closeDegreeSpacing(held);
}

// ── Summary cache ─────────────────────────────────────────────────────────────

// Every visitor in the same 15-minute data window is summarising identical
// inputs, so completed summaries are cached and replayed instead of paying
// for a fresh model call per visitor. Keyed by a hash of the full request
// inputs (minus the ever-changing clock time), so a manipulated payload can
// only ever poison its own cache slot, never another visitor's.
//
// The map lives in module scope: on serverless hosting each warm instance
// keeps its own copy, so this is best-effort dedup rather than a guarantee -
// which is fine, it exists to cut costs, not for correctness.
const summaryCache = new Map<
  string,
  { promise: Promise<string>; expires: number }
>();
const SUMMARY_CACHE_TTL_MS = 20 * 60 * 1000;
const SUMMARY_CACHE_MAX_ENTRIES = 50;

async function summaryCacheKey(
  body: SummaryRequest,
  model: string
): Promise<string> {
  // currentTime advances every minute and would defeat the cache; within one
  // data window a summary generated a few minutes ago is still the summary.
  const input = JSON.stringify({
    conditions: body.conditions,
    hourlyForecast: body.hourlyForecast ?? null,
    currentlyDark: body.currentlyDark ?? false,
    period: body.period ?? null,
    outlook: body.outlook ?? null,
    model,
  });
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return Buffer.from(digest).toString("hex");
}

function pruneSummaryCache() {
  const now = Date.now();
  for (const [key, entry] of summaryCache) {
    if (entry.expires <= now) summaryCache.delete(key);
  }
  // Map iterates in insertion order, so evicting from the front drops the
  // oldest entries first if pruning expired ones wasn't enough.
  while (summaryCache.size > SUMMARY_CACHE_MAX_ENTRIES) {
    const oldest = summaryCache.keys().next().value;
    if (oldest === undefined) break;
    summaryCache.delete(oldest);
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  if (!process.env.GROQ_API_KEY) {
    return new Response("API key not configured", { status: 503 });
  }

  const body: SummaryRequest = await request.json();

  // The model name arrives from the client, so it can't be trusted as-is -
  // anything outside the allowlist would let arbitrary visitors run whichever
  // Groq model they like on this deployment's API key.
  const model = ALLOWED_AI_MODELS.includes(body.model ?? DEFAULT_AI_MODEL)
    ? (body.model ?? DEFAULT_AI_MODEL)
    : DEFAULT_AI_MODEL;

  pruneSummaryCache();
  const cacheKey = await summaryCacheKey(body, model);
  const cached = summaryCache.get(cacheKey);
  if (cached) {
    try {
      const text = await cached.promise;
      return new Response(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    } catch {
      // The generation this entry pointed at failed; fall through to retry.
      summaryCache.delete(cacheKey);
    }
  }

  const conditionsParts = buildConditionsParts(body);

  const client = new Groq();
  const groqStream = await client.chat.completions.create({
    model,
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: 2048,
    reasoning_effort: "medium",
    stream: true,
    messages: [
      { role: "user", content: `${BRIEFING_PROMPT}\n\n${conditionsParts}` },
    ],
  });

  // Registered before the first chunk arrives so concurrent requests for the
  // same inputs await this generation instead of starting their own.
  let resolveSummary!: (text: string) => void;
  let rejectSummary!: (err: unknown) => void;
  const summaryPromise = new Promise<string>((resolve, reject) => {
    resolveSummary = resolve;
    rejectSummary = reject;
  });
  // An abandoned (client-cancelled) generation rejects this promise; without
  // a handler of its own that's an unhandled rejection crash.
  summaryPromise.catch(() => {});
  summaryCache.set(cacheKey, {
    promise: summaryPromise,
    expires: Date.now() + SUMMARY_CACHE_TTL_MS,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let fullText = "";
      try {
        for await (const text of normaliseUnits(stripThinkTags(groqStream))) {
          fullText += text;
          controller.enqueue(encoder.encode(text));
        }
        controller.close();
        resolveSummary(fullText);
      } catch (err) {
        // Incomplete generations (Groq error, client disconnect) must not be
        // served to the next visitor.
        summaryCache.delete(cacheKey);
        rejectSummary(err);
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

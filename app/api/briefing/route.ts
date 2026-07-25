import Groq from "groq-sdk";
import { KayakConditions } from "@/types";
import { formatMetTime, degreesToCompass } from "@/lib/weather";
import {
  THRESHOLDS,
  VISIBILITY_DESCRIPTIONS,
  DEFAULT_AI_MODEL,
} from "@/lib/config";
import {
  formatRiverLevel,
  formatTemperature,
  formatWindSpeed,
  formatWindGust,
} from "@/lib/units";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Outlook {
  dayLabel: string;
  bestTimes: string | null;
  rangesText: string;
}

interface SummaryRequest {
  conditions: KayakConditions;
  hourlyForecast?: string | null;
  sunrise?: string | null;
  sunset?: string | null;
  currentlyDark?: boolean;
  currentTime?: string;
  model?: string;
  outlook?: Outlook | null;
  bestConditionsLine?: string | null;
  gapConditionsLine?: string | null;
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const BRIEFING_PROMPT = `\
You are writing a short conditions briefing for members of a kayaking club on the River Severn at Worcester. You are given an hour-by-hour forecast, plus the club's current conditions when it isn't currently dark. Normally this covers today's remaining daylight hours; if it is currently dark, it instead covers the next available daylight window (later today or tomorrow) – determine which from the date/time on the entries provided, not by guessing.

Each hour carries a status. From best to worst: Light Green, Dark Green, Amber, Red, No Paddling.

The data includes a line starting "Best conditions ...:" giving the definitive, already-computed best-conditions window(s) for the period, with correct sunrise/sunset boundary handling already applied. Always use that line's exact time boundaries and status colour rather than recomputing your own window from the hour-by-hour table. If that line lists more than one comma-separated time range, they are all part of the same best-status window with a break in between – you must mention every range given, not just the longest one; never silently drop a later range. Do not merge hours of different statuses into a single window.

Whenever a window boundary is given as "sunrise" or "sunset" rather than a clock time, always state its actual time too, using the Sunrise/Sunset lines given in the data, worked naturally into the sentence without parentheses – e.g. "light green from sunrise at 05:03 until 17:00" or "light green until sunset at 21:14", never a bare "sunrise" or "sunset" with no time attached.

Each hour-by-hour entry covers conditions from that hour until the next entry begins. The list covers daylight hours only – later hours are omitted because it gets dark. The final listed hour's conditions extend to sunset, which is always provided in the data – use that time as the window's end. This means each hour slot represents that full hour. For example, if light green is listed from sunrise until 18:00 and then dark green starts at 19:00, the light green window runs all the way until 19:00 (since the 18:00 slot lasts until 19:00). Never subtract an hour or say "until 18:00" when the 18:00 hour slot is still light green.

Write 2–3 short sentences giving a broad sweep of how conditions look across the period being summarised. The first sentence should naturally weave in the best window and its status colour, plus the headline figures (river level, temperature range, wind). This length applies whether you're summarising today's remaining hours or a future window. If there are no green conditions (i.e. the best available status is amber, red, or no paddling), note this instead of highlighting a best window. Only call something a "warning" if it is one of the official Met Office weather warnings supplied in the data; only mention those that are active or upcoming within the specific period you are summarising, briefly noting the most severe one and how it might impact paddling (e.g. "be aware of the red heat warning"). A plain spell of higher wind (or any other dip shown only in the hour-by-hour reasons, with no matching Met Office warning) is not a "warning" – describe it plainly instead (e.g. "it turns windier around 17:00"). Be punchy and avoid verbosity.

Don't chain more than two comma-separated clauses into one sentence. When you have several distinct things to say - the conditions summary and the launch message - give each its own short sentence rather than stringing them all together with commas into one long run-on sentence.

If a status name would fall at the very start of a sentence, rephrase to avoid leading with it. Use specific figures with this exact unit formatting: river level as value m (space before the unit, e.g. "1.20 m"), temperature as value°C (no space, e.g. "18.1°C"), wind speed as value mph (space before the unit, e.g. "6.9 mph"), time in 24-hour format (e.g. 14:00). Temperature can vary a fair amount across the period being summarised, so phrase it as "between X°C and Y°C" rather than a single figure. If the best window is already under way, say "now" rather than giving the start time (e.g. "…light green now until 20:00…").

Wind gusts are given separately from sustained wind speed and are not part of the status calculation - never treat a gust figure as raising or changing the status. Only mention gusts when they're provided, and fold them in right alongside the wind speed figure itself (e.g. "wind around 12 mph, gusting up to 24 mph") rather than as a separate sentence elsewhere.

Rain that's flagged as occurring at a warm temperature is deliberately excluded from the status calculation - it's only mentioned as a courtesy heads-up, never as something that lowers the status. When this is flagged, briefly mention that it's raining alongside the temperature figure (e.g. "a warm 18°C with some rain") rather than treating it as a mark against conditions.

If the data includes a line starting "Gap(s) within the best-conditions window:", the best-status window has one or more breaks in it – this line is the definitive, already-computed status, time range, and reason for each break, so use it exactly rather than deriving it yourself from the hour-by-hour table. Weave it directly into the same sentence that gives the window, right between the two ranges it falls between, always including all three pieces given: the status it drops to, the time range of the drop, and its reason if one is given. Never give only one or two of the three when all three are present. For example, if that line reads "17:00–20:00 dark green due to High winds", write "light green from sunrise until 17:00, dropping to dark green until 20:00 for high winds, then light green again until sunset" – not "...dropping briefly for a windy spell..." (missing the status and the given time range), and not "...dropping to dark green until 20:00, then light green again..." (missing the reason). Don't state both ranges up front and only explain the drop in a separate, later sentence. If that line is absent, the best-status window has no gaps – don't invent one.

Strict negative constraint: Do not use any parenthetical or bracketed text to explain or contain figures, speeds, reasons, or notes in the output (for example, avoid "(15 mph)" or "[due to wind]"). All details must flow naturally as part of the sentence itself.

The overall status already captures safety – don't add your own risk commentary on individual figures like river level. When a "Launch message" line is provided (only present when summarising today's remaining hours), it contains specific landmark observations (e.g. water over a step) and should be summarised accurately as an approximation for access, without inventing club divisions like "sections" or "lanes". When instead summarising a future outlook (no "Launch message" line provided), use the "launch:" note attached to each hour-by-hour entry, since it reflects the forecast river level for that hour rather than today's current level – if it stays materially the same across the window, give one brief representative sentence; if it changes noticeably during the window, say so briefly rather than presenting one hour's note as constant throughout.

Mention the river trend if it is notable (rising or falling); strictly avoid any mention of the river trend, stability, or level changes if the trend is described as steady.

If it is currently dark, no current-conditions figures are provided at all (they wouldn't apply to the period you're summarising) – go straight to the outlook for the next available paddling window, using only the forecast data given. This is later today if it's currently post-midnight (before sunrise), or tomorrow if it's currently pre-midnight (after sunset). Use the figures provided for that period. State upfront, in the first sentence, which period this is for, using the same wording given in the data (e.g. "Tomorrow's light green window..." or "Later today, light green conditions..."), so members can tell at a glance that this isn't describing right now.

If it is not currently dark, current-conditions figures (overall status, wind, etc.) are provided – that's your signal you're summarising today, right now, even if the best window itself starts a little later in the day. In that case never use the "Tomorrow's..."/"Later today..." framing or any other day label; just describe the window plainly with its actual time (e.g. "Light green conditions run from 09:00 until 16:00..."). That framing is reserved strictly for when current-conditions figures are absent.

Don't mention or speculate about any dates or periods for which no data has been provided.

Write only the summary – no headings, bullet points, or introductory labels. Use British English throughout (metres, colour, favourable, summarise, etc.). Keep the tone friendly and accessible; members range from beginners to experienced paddlers.`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildConditionsParts(req: SummaryRequest): string {
  const {
    conditions,
    hourlyForecast,
    sunrise,
    sunset,
    currentlyDark,
    currentTime,
    outlook,
    bestConditionsLine,
    gapConditionsLine,
  } = req;

  const windDir =
    conditions.windDirection !== undefined
      ? degreesToCompass(conditions.windDirection)
      : null;

  const weatherWarnings = conditions.warnings?.length
    ? `Met Office weather warnings for Worcestershire:\n${conditions.warnings
        .map(
          (w) =>
            `- ${w.severity} ${w.type}: ${w.headline}. Valid: ${formatMetTime(w.validFrom)} to ${formatMetTime(w.validTo)}`
        )
        .join("\n")}`
    : null;

  // Current-conditions readings (as opposed to forecast/outlook data) only
  // describe right now, so they're omitted entirely when it's dark and the
  // summary is for a future window instead – nothing here would apply.
  const lines: (string | null)[] = [
    currentTime ? `Current time: ${currentTime}` : null,
    !currentlyDark ? `Overall status: ${conditions.overallStatus}` : null,
    !currentlyDark && conditions.riverLevel !== undefined
      ? `River level: ${formatRiverLevel(conditions.riverLevel)}`
      : null,
    !currentlyDark && conditions.levelChange
      ? (() => {
          const val = conditions.levelChange.value;
          const absVal = Math.abs(val);
          if (absVal <= THRESHOLDS.RIVER_LEVEL_TREND_THRESHOLD) {
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
    !currentlyDark &&
    conditions.windGust !== undefined &&
    conditions.windGust >= THRESHOLDS.WIND_GUST_NOTABLE
      ? `Wind gusts: ${formatWindGust(conditions.windGust)} (gusts only - not sustained wind, and not part of the status calculation)`
      : null,
    !currentlyDark && conditions.rain
      ? conditions.rainWhileWarm
        ? `Rain: ${conditions.weatherDescription || "yes"} (occurring at a warm temperature - deliberately not part of the status calculation, mention only as a brief heads-up)`
        : `Rain: ${conditions.weatherDescription || "yes"}`
      : null,
    !currentlyDark &&
    conditions.visibilityDescription &&
    conditions.visibility !== undefined &&
    conditions.visibility < VISIBILITY_DESCRIPTIONS.MODERATE.min
      ? `Visibility: ${conditions.visibilityDescription}`
      : null,
    !currentlyDark && conditions.reasons?.length
      ? `Reasons for status: ${conditions.reasons.join("; ")}`
      : null,
    conditions.launchMessage && !currentlyDark
      ? `Launch message: ${conditions.launchMessage}`
      : null,
    sunrise ? `Sunrise: ${sunrise}` : null,
    sunset ? `Sunset: ${sunset}` : null,
    hourlyForecast
      ? `Hour-by-hour forecast for the summarized daylight window:\n${hourlyForecast}`
      : null,
    currentlyDark && outlook
      ? `It is currently dark. The outlook for ${outlook.dayLabel} is: ${outlook.rangesText}.`
      : null,
    bestConditionsLine
      ? `${bestConditionsLine} — this is the definitive, already-computed best-conditions window(s) for the period; use its exact time boundaries and status colour rather than recomputing your own from the hour-by-hour table.`
      : null,
    gapConditionsLine
      ? `Gap(s) within the best-conditions window: ${gapConditionsLine}`
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

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_FEATURE_AI_SUMMARY === "false") {
    return new Response("AI Summary is disabled", { status: 503 });
  }
  if (!process.env.GROQ_API_KEY) {
    return new Response("API key not configured", { status: 503 });
  }

  const body: SummaryRequest = await request.json();
  const conditionsParts = buildConditionsParts(body);

  const client = new Groq();
  const groqStream = await client.chat.completions.create({
    model: body.model ?? DEFAULT_AI_MODEL,
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: 2048,
    reasoning_effort: "medium",
    stream: true,
    messages: [
      { role: "user", content: `${BRIEFING_PROMPT}\n\n${conditionsParts}` },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const text of stripThinkTags(groqStream)) {
        controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

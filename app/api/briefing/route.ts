import Groq from "groq-sdk";
import { KayakConditions } from "@/types";
import { formatMetTime, degreesToCompass } from "@/lib/weather";
import { VISIBILITY_DESCRIPTIONS, DEFAULT_AI_MODEL } from "@/lib/config";
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
  outlook?: Outlook | null;
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const BRIEFING_PROMPT = `\
You are writing a single-sentence weather vibe for members of a kayaking club on the River Severn at Worcester, in the style of a weather app's AI summary (e.g. "Pleasant, partly cloudy morning, and it will stay mild throughout the day, with warmer weather on the way.").

The data below labels each hour with a paddling status. From best to worst: Light Green, Dark Green, Amber, Red, No Paddling. Use this ranking to judge whether conditions are improving or worsening - don't assume, since "Light Green" and "Dark Green" aren't a standard colour convention.

Write ONE short, natural sentence (roughly 15-25 words) capturing the overall feel of paddling conditions across the period being summarised - today's remaining daylight hours, or if it's currently dark, the next available daylight window (later today or tomorrow, stated plainly, e.g. "Tomorrow looks..." or "Later today looks..."). Ground it in what conditions are like at the start of that period (or right now, if summarising today): give the plain-language cause (e.g. "a bit breezy"), then the status colour it leads to, phrased causally rather than as if the colour were another weather attribute - e.g. "a bit breezy at the moment, putting things at dark green", not "breezy and dark green" (that reads as though "dark green" were a weather condition itself, rather than the status it results in). Then say how it trends from there if it changes (e.g. "easing to light green later") - don't just name a destination adjective like "increasingly favourable" without ever stating what it starts as. Mention the standout factor in plain everyday language if there is one (e.g. breezy, a chance of rain, a weather warning) - not exact figures, times, or window boundaries. Don't enumerate individual dips, gaps, or hours; just capture the overall shape of the day.

Only mention a weather warning if it's one of the official Met Office warnings supplied in the data and it's active or upcoming in the period you're summarising.

Write only the sentence - no headings, labels, or quote marks. Use British English (mild, favourable, etc.) and a friendly, accessible tone for members ranging from beginners to experienced paddlers.`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildConditionsParts(req: SummaryRequest): string {
  const { conditions, hourlyForecast, currentlyDark, currentTime, outlook } = req;

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
    !currentlyDark && conditions.reasons?.length
      ? `Reasons for status: ${conditions.reasons.join("; ")}`
      : null,
    hourlyForecast
      ? `Hour-by-hour forecast for the summarized daylight window:\n${hourlyForecast}`
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

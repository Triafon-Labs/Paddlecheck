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
You are writing a single-sentence summary of river and weather conditions for members of a kayaking club on the River Severn at Worcester, in the style of a weather app's AI summary (e.g. "Pleasant, partly cloudy morning, and it will stay mild throughout the day, with warmer weather on the way.").

Write ONE short, natural sentence summarising conditions across the period the data covers - today's remaining daylight hours, or if it's currently dark, the next available daylight window (later today or tomorrow, stated plainly, e.g. "Tomorrow looks..."). Ground it in conditions at the start of that period (or right now, if summarising today), then say how they trend if they change - e.g. "breezy at the moment, easing off later" or "the river is around 0.80 m, rising towards 1.50 m by evening". Pick the most notable factor or two (wind, rain, river level, temperature) rather than covering everything, don't enumerate individual hours, and copy the unit style from the data for any figure you quote.

Only mention a weather warning if it's one of the official Met Office warnings supplied in the data and it's active or upcoming in the period you're summarising.

Don't pass verdicts on whether or where to paddle ("a great day for a paddle") - the app's status rating covers that.

Write only the sentence - no headings, labels, or quote marks. Use British English (mild, favourable, metres) and a friendly, accessible tone for members ranging from beginners to experienced paddlers.`;

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

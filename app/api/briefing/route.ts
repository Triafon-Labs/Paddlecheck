import Groq from "groq-sdk";
import { KayakConditions } from "@/types";
import { formatMetTime, degreesToCompass } from "@/lib/weather";
import { THRESHOLDS, VISIBILITY_DESCRIPTIONS } from "@/lib/config";

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
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const BRIEFING_PROMPT = `\
You are writing a short conditions briefing for members of a kayaking club on the River Severn at Worcester. You are given current conditions and an hour-by-hour forecast. Normally this covers today's remaining daylight hours; if it is currently dark, it instead covers the next available daylight window (later today or tomorrow) – determine which from the date/time on the entries provided, not by guessing.

Each hour carries a status. From best to worst: Light Green, Dark Green, Amber, Red, No Paddling.

The best window is the longest contiguous run of hours sharing the highest-ranked status present in the period being summarised. If any hours are light green, the best window is the longest unbroken block of light green hours; only if no light green hours exist does dark green become the best window, and so on. If two blocks of the top-ranked status are equal in length, mention both, but keep this brief – don't let it bloat the summary. Do not merge hours of different statuses into a single window.

Each hour-by-hour entry covers conditions from that hour until the next entry begins. The list covers daylight hours only – later hours are omitted because it gets dark. The final listed hour's conditions extend to sunset, which is always provided in the data – use that time as the window's end.

Write 2–3 concise sentences giving a broad sweep of how conditions look across the period being summarised, naturally weaving in the best window and its status colour. This 1–2 sentence limit applies whether you're summarising today's remaining hours or a future window. If there are no green conditions (i.e. the best available status is amber, red, or no paddling), note this instead of highlighting a best window. Only mention weather warnings that are active or upcoming within the specific period you are summarising. If there are such warnings, briefly mention the most severe one and how it might impact paddling (e.g. "be aware of the red heat warning"). Be punchy and avoid verbosity.

Status names are always lowercase (light green, dark green, amber, red, no paddling). If a status name would fall at the very start of a sentence, rephrase to avoid leading with it. Use specific figures: river level in metres, temperature as value°C (no space), wind speed in mph, time in 24-hour format (e.g. 14:00). Temperature can vary a fair amount across the period being summarised, so phrase it as "between X°C and Y°C" rather than a single figure. If the best window is already under way, say "now" rather than giving the start time (e.g. "…light green now until 20:00…").

The overall status already captures safety – don't add your own risk commentary on individual figures like river level. Weave in the launch message naturally when it contains meaningful detail beyond "Normal conditions" – if present, it's already been judged relevant (e.g. it won't be sent for light green conditions under 1m), so summarise its practical meaning for access in plain terms without quoting the exact figure or threshold number verbatim.

Mention the river trend if it is notable (rising or falling); strictly avoid any mention of the river trend, stability, or level changes if the trend is described as steady.

If it is currently dark, do not summarise current conditions – go straight to the outlook for the next available paddling window. This is later today if it's currently post-midnight (before sunrise), or tomorrow if it's currently pre-midnight (after sunset). Use the figures provided for that period.

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

  const lines: (string | null)[] = [
    currentTime ? `Current time: ${currentTime}` : null,
    `Overall status: ${conditions.overallStatus}`,
    conditions.riverLevel !== undefined
      ? `River level: ${conditions.riverLevel.toFixed(2)}m`
      : null,
    conditions.levelChange
      ? (() => {
          const val = conditions.levelChange.value;
          const absVal = Math.abs(val);
          if (absVal <= THRESHOLDS.RIVER_LEVEL_TREND_THRESHOLD) {
            return "River trend: steady";
          }
          const trend = val > 0 ? "rising" : "falling";
          return `River trend: ${val >= 0 ? "+" : ""}${val.toFixed(2)}m over ${conditions.levelChange.period} (${trend})`;
        })()
      : null,
    conditions.temperature !== undefined
      ? `Air temperature: ${conditions.temperature}°C`
      : null,
    conditions.windSpeed !== undefined
      ? `Wind: ${conditions.windSpeed} mph${windDir ? ` from the ${windDir}` : ""}`
      : null,
    conditions.rain ? `Rain: ${conditions.weatherDescription || "yes"}` : null,
    conditions.visibilityDescription &&
    conditions.visibility !== undefined &&
    conditions.visibility < VISIBILITY_DESCRIPTIONS.MODERATE.min
      ? `Visibility: ${conditions.visibilityDescription}`
      : null,
    conditions.reasons?.length
      ? `Reasons for status: ${conditions.reasons.join("; ")}`
      : null,
    conditions.launchMessage && conditions.overallStatus !== "Light Green"
      ? `Launch message: ${conditions.launchMessage}`
      : null,
    conditions.pitchcroftPaddleability
      ? `Pitchcroft: ${conditions.pitchcroftPaddleability}`
      : null,
    !currentlyDark && sunrise ? `Sunrise: ${sunrise}` : null,
    !currentlyDark && sunset ? `Sunset: ${sunset}` : null,
    !currentlyDark && hourlyForecast
      ? `Hour-by-hour forecast for today's remaining daylight:\n${hourlyForecast}`
      : null,
    currentlyDark && outlook
      ? `It is currently dark. The outlook for ${outlook.dayLabel} is: ${outlook.rangesText}.`
      : null,
    currentlyDark && outlook?.bestTimes
      ? `Best conditions ${outlook.dayLabel}: ${outlook.bestTimes}`
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
    model: body.model ?? "openai/gpt-oss-120b",
    temperature: 1.0,
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

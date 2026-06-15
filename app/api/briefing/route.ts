import Groq from "groq-sdk";
import { KayakConditions } from "@/types";

function degreesToCompass(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_FEATURE_AI_SUMMARY === "false") {
    return new Response("AI Summary is disabled", { status: 503 });
  }
  if (!process.env.GROQ_API_KEY) {
    return new Response("API key not configured", { status: 503 });
  }

  const client = new Groq();
  const {
    conditions,
    hourlyForecast,
    sunrise,
    sunset,
    currentlyDark,
    currentTime,
    model,
    outlook,
  }: {
    conditions: KayakConditions;
    hourlyForecast?: string | null;
    sunrise?: string | null;
    sunset?: string | null;
    currentlyDark?: boolean;
    currentTime?: string;
    model?: string;
    outlook?: { dayLabel: string; bestTimes: string | null; rangesText: string } | null;
  } = await request.json();

  const selectedModel = model ?? "qwen/qwen3-32b";

  const windDir =
    conditions.windDirection !== undefined
      ? degreesToCompass(conditions.windDirection)
      : null;

  const parts = [
    currentTime ? `Current time: ${currentTime}` : null,
    `Overall status: ${conditions.overallStatus}`,
    conditions.riverLevel !== undefined
      ? `River level: ${conditions.riverLevel.toFixed(2)}m`
      : null,
    conditions.levelChange
      ? `River trend: ${conditions.levelChange.value >= 0 ? "+" : ""}${conditions.levelChange.value}m over ${conditions.levelChange.period}`
      : null,
    conditions.temperature !== undefined
      ? `Air temperature: ${conditions.temperature}°C`
      : null,
    conditions.windSpeed !== undefined
      ? `Wind: ${conditions.windSpeed} mph${windDir ? ` from the ${windDir}` : ""}`
      : null,
    conditions.rain ? `Rain: yes` : null,
    conditions.visibilityDescription
      ? `Visibility: ${conditions.visibilityDescription}`
      : conditions.visibility !== undefined
        ? `Visibility: ${conditions.visibility}m`
        : null,
    conditions.reasons?.length
      ? `Reasons for status: ${conditions.reasons.join("; ")}`
      : null,
    conditions.launchMessage ? `Launch message: ${conditions.launchMessage}` : null,
    conditions.pitchcroftPaddleability
      ? `Pitchcroft: ${conditions.pitchcroftPaddleability}`
      : null,
    !currentlyDark && sunrise ? `Sunrise: ${sunrise}` : null,
    !currentlyDark && sunset ? `Sunset: ${sunset}` : null,
    !currentlyDark && hourlyForecast
      ? `Hour-by-hour forecast for today's remaining daylight:\n${hourlyForecast}`
      : null,
    currentlyDark && outlook
      ? `It is currently dark, so do not summarise the current conditions. Instead, the outlook for ${outlook.dayLabel} is: ${outlook.rangesText}.`
      : null,
    currentlyDark && outlook?.bestTimes
      ? `Best conditions ${outlook.dayLabel}: ${outlook.bestTimes}`
      : null,
    currentlyDark && !outlook ? `It is currently dark and no daytime forecast is available.` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const stream = await client.chat.completions.create({
    model: selectedModel,
    temperature: 0.7,
    top_p: 0.9,
    stream: true,
    messages: [
      {
        role: "user",
        content: `You are writing a short conditions briefing for members of a kayaking club on the River Severn at Worcester. Refer to yourself as I. You are given current conditions and an hour-by-hour forecast for today's remaining daylight hours.

Each hour has a status. The statuses, from best to worst, are: Light Green, Dark Green, Amber, Red, and No Paddling. Note that Light Green is better than Dark Green. The best window is the run of hours sharing the highest-ranked status that appears that day: if any hours are Light Green, the best window is those Light Green hours; only if there are no Light Green hours does Dark Green become the best window, and so on. Don't merge hours of different statuses into a single window.

The hour-by-hour list covers daylight hours only. Each entry describes conditions for that hour onward, and the final entry's conditions hold until sunset — later hours are omitted purely because it becomes dark. So if the last daylight hour belongs to the best window, extend that window's end time to sunset rather than stopping at the last listed hour.

Write 2–3 plain-English sentences that: (1) give a broad sweep of how conditions look across the day, and (2) mention the best window for paddling today, weaving its status colour naturally into the sentence in lowercase (e.g. "conditions are light green from 09:00 until sunset") — or note if there are no green conditions. When a best window has already started (i.e. its start hour is at or before the current time), say it starts "now" rather than stating the clock time (e.g. "conditions are light green now until 20:00" rather than "conditions are light green from 13:00 until 20:00"). Use the specific figures — river level in metres, temperature in °C, wind speed in mph, and time ranges in 24-hour format (e.g. 14:00, not 2pm). Weave the figures into natural, flowing sentences. Do weave in the best window's status colour, but don't restate the current overall status label verbatim; and don't list the data. Write in British English throughout — use UK spellings (e.g. metres, colour, favourable, summarise) and UK phrasing. Keep it friendly and accessible — members range from beginners to experienced paddlers.

If the data indicates it is currently dark, say that I won't summarise the current conditions because it's dark, then give the outlook for the next paddling day (tomorrow, or later today) using the figures provided. When describing a temperature range for a future day, phrase it as "between X°C and Y°C" — it is the range across the day, not a progression from now.

${parts}

Write only the summary. No headings, no bullet points.`,
      },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let inThink = false;
      let buf = "";

      for await (const chunk of stream) {
        buf += chunk.choices[0]?.delta?.content ?? "";

        let out = "";
        while (buf.length > 0) {
          if (inThink) {
            const end = buf.indexOf("</think>");
            if (end === -1) { buf = ""; break; }
            buf = buf.slice(end + 8);
            inThink = false;
          } else {
            const start = buf.indexOf("<think>");
            if (start === -1) { out += buf; buf = ""; break; }
            out += buf.slice(0, start);
            buf = buf.slice(start + 7);
            inThink = true;
          }
        }

        if (out) controller.enqueue(encoder.encode(out));
      }
      if (!inThink && buf) controller.enqueue(encoder.encode(buf));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

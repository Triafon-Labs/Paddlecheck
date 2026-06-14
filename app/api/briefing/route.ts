import Groq from "groq-sdk";
import { KayakConditions } from "@/types";

function degreesToCompass(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

export async function POST(request: Request) {
  if (!process.env.GROQ_API_KEY) {
    return new Response("API key not configured", { status: 503 });
  }

  const client = new Groq();
  const {
    conditions,
    bestTimes,
    sunset,
    currentlyDark,
    currentTime,
    model,
    outlook,
  }: {
    conditions: KayakConditions;
    bestTimes?: string | null;
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
    conditions.dark ? `Currently dark: yes` : null,
    conditions.reasons?.length
      ? `Reasons for status: ${conditions.reasons.join("; ")}`
      : null,
    conditions.launchMessage ? `Launch message: ${conditions.launchMessage}` : null,
    conditions.pitchcroftPaddleability
      ? `Pitchcroft: ${conditions.pitchcroftPaddleability}`
      : null,
    !currentlyDark && sunset ? `Sunset today: ${sunset}` : null,
    !currentlyDark ? (bestTimes ?? null) : null,
    currentlyDark && outlook
      ? `It is currently dark, so members have most likely finished paddling for today. Outlook for ${outlook.dayLabel}: ${outlook.rangesText}.`
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
    temperature: 0.4,
    top_p: 0.9,
    stream: true,
    messages: [
      {
        role: "user",
        content: `You are writing a short conditions briefing for members of a kayaking club on the River Severn at Worcester. Given the data below, write 2–3 plain-English sentences summarising today's paddling situation. Use the specific figures from the data — river level in metres, temperature in °C, wind speed in mph, and the exact time window if best conditions are provided. Focus on the most important factors driving the status. Don't repeat the status label verbatim or add safety advice beyond what the data already shows. Keep it friendly and accessible — members range from beginners to experienced paddlers.

If the data indicates it is currently dark, briefly acknowledge that it's likely too dark to paddle now, then give the outlook for the next paddling day using the figures provided.

${parts}

Write only the summary. No headings, no bullet points, no preamble.`,
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

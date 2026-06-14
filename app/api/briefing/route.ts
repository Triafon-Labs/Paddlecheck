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
  }: {
    conditions: KayakConditions;
    bestTimes?: string | null;
    sunset?: string | null;
    currentlyDark?: boolean;
  } = await request.json();

  const windDir =
    conditions.windDirection !== undefined
      ? degreesToCompass(conditions.windDirection)
      : null;

  const parts = [
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
    bestTimes ?? null,
    currentlyDark ? `Currently dark — best conditions will be tomorrow` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const stream = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 120,
    stream: true,
    messages: [
      {
        role: "user",
        content: `You are writing a short conditions briefing for members of a kayaking club on the River Severn at Worcester. Given the data below, write 2–3 plain-English sentences summarising today's paddling situation. Use the specific figures from the data — river level in metres, temperature in °C, wind speed in mph, and the exact time window if best conditions are provided. Focus on the most important factors driving the status. Don't repeat the status label verbatim or add safety advice beyond what the data already shows. Keep it friendly and accessible — members range from beginners to experienced paddlers.

${parts}

Write only the summary. No headings, no bullet points, no preamble.`,
      },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

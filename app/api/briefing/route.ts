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
  const conditions: KayakConditions = await request.json();

  const windDir =
    conditions.windDirection !== undefined
      ? degreesToCompass(conditions.windDirection)
      : null;

  const parts = [
    `Overall status: ${conditions.overallStatus}`,
    conditions.riverLevel !== undefined
      ? `River level: ${conditions.riverLevel}m`
      : null,
    conditions.levelChange
      ? `River trend: ${conditions.levelChange.value >= 0 ? "+" : ""}${conditions.levelChange.value}m over ${conditions.levelChange.period}`
      : null,
    conditions.temperature !== undefined
      ? `Water temperature: ${conditions.temperature}°C`
      : null,
    conditions.windSpeed !== undefined
      ? `Wind: ${conditions.windSpeed} mph${windDir ? ` from the ${windDir}` : ""}`
      : null,
    conditions.rain !== undefined ? `Rain: ${conditions.rain ? "yes" : "no"}` : null,
    conditions.visibilityDescription
      ? `Visibility: ${conditions.visibilityDescription}`
      : conditions.visibility !== undefined
        ? `Visibility: ${conditions.visibility}m`
        : null,
    conditions.dark !== undefined
      ? `Currently dark: ${conditions.dark ? "yes" : "no"}`
      : null,
    conditions.reasons?.length
      ? `Reasons for status: ${conditions.reasons.join("; ")}`
      : null,
    conditions.launchMessage ? `Launch area: ${conditions.launchMessage}` : null,
    conditions.pitchcroftPaddleability
      ? `Pitchcroft: ${conditions.pitchcroftPaddleability}`
      : null,
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
        content: `You are writing a short conditions briefing for members of a kayaking club on the River Severn at Worcester. Given the data below, write 2–3 plain-English sentences summarising today's paddling situation. Focus on the most important factors driving the status. Don't repeat the status label verbatim or add safety advice beyond what the data already shows. Keep it friendly and accessible — members range from beginners to experienced paddlers.

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

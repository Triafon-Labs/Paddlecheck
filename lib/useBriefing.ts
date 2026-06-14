"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KayakConditions, DayForecast } from "@/types";
import { buildBestPaddlingTimes } from "@/lib/forecast";

async function streamBriefing(
  conditions: KayakConditions,
  forecastDays: DayForecast[] | null,
  onChunk: (chunk: string) => void
): Promise<void> {
  const todayForecast = forecastDays?.[0] ?? null;
  const currentlyDark = conditions.dark ?? false;
  const bestTimes = currentlyDark ? null : buildBestPaddlingTimes(todayForecast);
  const sunset = todayForecast?.sunset
    ? todayForecast.sunset.split("T")[1]?.slice(0, 5)
    : null;

  const res = await fetch("/api/briefing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conditions, bestTimes, sunset, currentlyDark }),
  });

  if (!res.ok || !res.body) throw new Error("Failed");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value));
  }
}

export function useBriefing(
  conditions: KayakConditions | null,
  forecastDays: DayForecast[] | null,
  auto: boolean
) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const fetchedForRef = useRef<string | null>(null);

  const doFetch = useCallback(async () => {
    if (!conditions) return;
    const key = conditions.lastUpdated ?? JSON.stringify(conditions);
    if (fetchedForRef.current === key) return;
    fetchedForRef.current = key;

    setText("");
    setLoading(true);
    setFailed(false);
    setTriggered(true);

    try {
      await streamBriefing(conditions, forecastDays, (chunk) =>
        setText((prev) => prev + chunk)
      );
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [conditions, forecastDays]);

  useEffect(() => {
    if (auto && conditions) doFetch();
  }, [auto, conditions, doFetch]);

  const trigger = useCallback(() => doFetch(), [doFetch]);

  return { text, loading, failed, triggered, trigger };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KayakConditions, DayForecast } from "@/types";
import { buildHourlyForecastText, buildNextDaytimeOutlook } from "@/lib/forecast";
import { isWithinInterval, parseISO } from "date-fns";

async function streamBriefing(
  conditions: KayakConditions,
  forecastDays: DayForecast[] | null,
  model: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const todayForecast = forecastDays?.[0] ?? null;
  const currentTime = new Date().toLocaleTimeString("en-GB", {
    timeZone: "Europe/London",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const sunrise = todayForecast?.sunrise
    ? todayForecast.sunrise.split("T")[1]?.slice(0, 5) ?? null
    : null;
  const sunset = todayForecast?.sunset
    ? todayForecast.sunset.split("T")[1]?.slice(0, 5) ?? null
    : null;
  // Derive dark from sunrise/sunset times rather than conditions.dark, which can be stale
  const currentlyDark = todayForecast
    ? (sunrise !== null && currentTime < sunrise) || (sunset !== null && currentTime >= sunset)
    : (conditions.dark ?? false);
  const hourlyForecast = !currentlyDark && todayForecast
    ? buildHourlyForecastText(todayForecast)
    : null;
  const outlook = currentlyDark ? buildNextDaytimeOutlook(forecastDays) : null;

  // Filter for warnings active right now to ensure AI only summarizes current threats
  const now = new Date();
  const activeWarnings = conditions.warnings?.filter((w) => {
    if (!w.validFromISO || !w.validToISO) return true;
    try {
      return isWithinInterval(now, {
        start: parseISO(w.validFromISO),
        end: parseISO(w.validToISO),
      });
    } catch {
      return true;
    }
  }) || [];

  const conditionsWithActiveWarnings = {
    ...conditions,
    warnings: activeWarnings,
  };

  const res = await fetch("/api/briefing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conditions: conditionsWithActiveWarnings,
      hourlyForecast,
      sunrise,
      sunset,
      currentlyDark,
      currentTime,
      model,
      outlook
    }),
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
  auto: boolean,
  model: string
) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const fetchedForRef = useRef<string | null>(null);

  const doFetch = useCallback(async () => {
    if (!conditions) return;
    const key = (conditions.lastUpdated ?? JSON.stringify(conditions)) + model;
    if (fetchedForRef.current === key) return;
    fetchedForRef.current = key;

    setText("");
    setLoading(true);
    setFailed(false);
    setTriggered(true);

    try {
      await streamBriefing(conditions, forecastDays, model, (chunk) =>
        setText((prev) => prev + chunk)
      );
    } catch (e) {
      console.error("Briefing fetch failed:", e);
      fetchedForRef.current = null;
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [conditions, forecastDays, model]);

  useEffect(() => {
    if (auto && conditions) doFetch();
  }, [auto, conditions, doFetch]);

  const trigger = useCallback(() => doFetch(), [doFetch]);

  return { text, loading, failed, triggered, trigger };
}

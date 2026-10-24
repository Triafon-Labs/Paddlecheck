"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KayakConditions, DayForecast } from "@/types";
import {
  buildHourlyForecastText,
  buildNextDaytimeOutlook,
  relativeDayLabel,
} from "@/lib/forecast";
import { getLondonHHMM, hhmmOfISO } from "@/lib/time";
import { isWarningOnDay } from "@/lib/warnings";

async function streamBriefing(
  conditions: KayakConditions,
  forecastDays: DayForecast[] | null,
  model: string,
  onChunk: (chunk: string) => void,
  signal: AbortSignal
): Promise<void> {
  const todayForecast = forecastDays?.[0] ?? null;
  const currentTime = getLondonHHMM();
  const todaySunrise = todayForecast?.sunrise
    ? hhmmOfISO(todayForecast.sunrise)
    : null;
  const todaySunset = todayForecast?.sunset
    ? hhmmOfISO(todayForecast.sunset)
    : null;
  // Derive dark from sunrise/sunset times rather than conditions.dark, which can be stale
  const currentlyDark = todayForecast
    ? (todaySunrise !== null && currentTime < todaySunrise) ||
      (todaySunset !== null && currentTime >= todaySunset)
    : (conditions.dark ?? false);

  // Find the target day being summarized
  let targetDay = todayForecast;
  let targetDayIndex = 0;
  if (currentlyDark && forecastDays) {
    const dayIndex = forecastDays.findIndex((day) =>
      day.graphData.some((pt) => !pt.reasons.includes("Dark"))
    );
    if (dayIndex !== -1) {
      targetDay = forecastDays[dayIndex];
      targetDayIndex = dayIndex;
    }
  }

  // Naming the period explicitly keeps the summary from reading as if a future
  // day's figures apply right now ("levels will stay low, around 0.33 m in the
  // morning" when the morning in question is tomorrow's).
  const period = !targetDay
    ? null
    : currentlyDark
      ? relativeDayLabel(targetDayIndex)
      : "the rest of today";

  const hourlyForecast = targetDay ? buildHourlyForecastText(targetDay) : null;
  const outlook = currentlyDark ? buildNextDaytimeOutlook(forecastDays) : null;

  // Only surface warnings that actually fall within the day being summarised
  // (today, or the next daylight day if it's currently dark) - a warning for
  // later in the week shouldn't show up in "today's" briefing.
  const relevantWarnings = targetDay
    ? conditions.warnings?.filter((w) => isWarningOnDay(w, targetDay.date)) ||
      []
    : [];

  const conditionsWithRelevantWarnings = {
    ...conditions,
    warnings: relevantWarnings,
  };

  const res = await fetch("/api/briefing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conditions: conditionsWithRelevantWarnings,
      hourlyForecast,
      currentlyDark,
      currentTime,
      model,
      period,
      outlook: outlook
        ? { dayLabel: outlook.dayLabel, rangesText: outlook.rangesText }
        : null,
    }),
    signal,
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
  const abortRef = useRef<AbortController | null>(null);

  const doFetch = useCallback(async () => {
    if (!conditions) return;
    const key = (conditions.lastUpdated ?? JSON.stringify(conditions)) + model;
    if (fetchedForRef.current === key) return;
    fetchedForRef.current = key;

    // Cancel any still-in-flight stream so its chunks can't interleave with this one.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setText("");
    setLoading(true);
    setFailed(false);
    setTriggered(true);

    try {
      await streamBriefing(
        conditions,
        forecastDays,
        model,
        (chunk) => setText((prev) => prev + chunk),
        controller.signal
      );
    } catch (e) {
      if (controller.signal.aborted) return;
      console.error("Briefing fetch failed:", e);
      fetchedForRef.current = null;
      setFailed(true);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [conditions, forecastDays, model]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (auto && conditions) doFetch();
  }, [auto, conditions, doFetch]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const trigger = useCallback(() => doFetch(), [doFetch]);

  return { text, loading, failed, triggered, trigger };
}

"use client";

import { useEffect, useRef, useState } from "react";
import { KayakConditions } from "@/types";
import { DayForecast } from "@/types";
import { buildBestPaddlingTimes } from "@/lib/forecast";

export function useBriefing(
  conditions: KayakConditions | null,
  forecastDays: DayForecast[] | null
) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const fetchedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!conditions) return;
    const key = conditions.lastUpdated ?? JSON.stringify(conditions);
    if (fetchedForRef.current === key) return;
    fetchedForRef.current = key;

    setText("");
    setLoading(true);
    setFailed(false);

    const todayForecast = forecastDays?.[0] ?? null;
    const currentlyDark = conditions.dark ?? false;
    const bestTimes = currentlyDark ? null : buildBestPaddlingTimes(todayForecast);
    const sunset = todayForecast?.sunset
      ? todayForecast.sunset.split("T")[1]?.slice(0, 5)
      : null;

    (async () => {
      try {
        const res = await fetch("/api/briefing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conditions, bestTimes, sunset, currentlyDark }),
        });

        if (!res.ok || !res.body) {
          setFailed(true);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setText((prev) => prev + decoder.decode(value));
        }
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [conditions, forecastDays]);

  return { text, loading, failed };
}

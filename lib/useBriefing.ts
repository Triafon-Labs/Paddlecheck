"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KayakConditions } from "@/types";
import { BRIEFING_UNAVAILABLE } from "@/lib/briefingInputs";

// Why the last request failed, when the server said.
export type BriefingFailure =
  (typeof BRIEFING_UNAVAILABLE)[keyof typeof BRIEFING_UNAVAILABLE] | "other";

class BriefingError extends Error {
  constructor(readonly reason: BriefingFailure) {
    super(reason);
  }
}

async function streamBriefing(
  model: string,
  onChunk: (chunk: string) => void,
  signal: AbortSignal
): Promise<void> {
  // Only the model is sent: the server writes the briefing from its own copy
  // of the conditions (lib/briefingInputs.ts).
  const res = await fetch("/api/briefing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model }),
    signal,
  });

  if (!res.ok || !res.body) {
    const body = res.status === 503 ? (await res.text()).trim() : "";
    throw new BriefingError(
      (Object.values(BRIEFING_UNAVAILABLE) as string[]).includes(body)
        ? (body as BriefingFailure)
        : "other"
    );
  }

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
  auto: boolean,
  model: string
) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState<BriefingFailure | null>(null);
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
    setFailed(null);
    setTriggered(true);

    try {
      await streamBriefing(
        model,
        (chunk) => setText((prev) => prev + chunk),
        controller.signal
      );
    } catch (e) {
      if (controller.signal.aborted) return;
      console.error("Briefing fetch failed:", e);
      fetchedForRef.current = null;
      setFailed(e instanceof BriefingError ? e.reason : "other");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [conditions, model]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (auto && conditions) doFetch();
  }, [auto, conditions, doFetch]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const trigger = useCallback(() => doFetch(), [doFetch]);

  return { text, loading, failed, triggered, trigger };
}

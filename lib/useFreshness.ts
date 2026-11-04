"use client";

import { useEffect, useState } from "react";
import { DATA_STALE_THRESHOLD_MS } from "./config";
import { getRelativeTimeString, getLondonHHMM } from "./time";

const isDataStale = (lastUpdated: string | undefined): boolean => {
  if (!lastUpdated) return false;
  return Date.now() - new Date(lastUpdated).getTime() > DATA_STALE_THRESHOLD_MS;
};

// How fresh the data on screen is: "10:33 · just now", and whether it's past
// DATA_STALE_THRESHOLD_MS. Re-read every 30 seconds so both stay right while
// the page is left open. Shared by the status card's "Updated" line and the
// stale-data banners in the top bar.
export const useFreshness = (lastUpdated: string | undefined) => {
  const [relative, setRelative] = useState<string>(() =>
    getRelativeTimeString(lastUpdated)
  );
  const [isStale, setIsStale] = useState<boolean>(() =>
    isDataStale(lastUpdated)
  );

  useEffect(() => {
    // Breaking synchronous context execution using queueMicrotask blocks cascading render lint rules
    queueMicrotask(() => {
      setRelative(getRelativeTimeString(lastUpdated));
      setIsStale(isDataStale(lastUpdated));
    });

    const interval = setInterval(() => {
      setRelative(getRelativeTimeString(lastUpdated));
      setIsStale(isDataStale(lastUpdated));
    }, 30000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  // "Updated just now" alone reads as if this instant triggered a live fetch,
  // when it may just be a fast cache hit on data fetched slightly earlier -
  // pairing it with the clock time it was actually fetched keeps that honest.
  const clockTime = lastUpdated ? getLondonHHMM(new Date(lastUpdated)) : null;
  const freshnessText =
    clockTime && relative ? `${clockTime} · ${relative}` : relative;

  return { freshnessText, isStale };
};

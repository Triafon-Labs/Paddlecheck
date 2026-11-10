"use client";

import { DATA_STALE_THRESHOLD_MS } from "./config";
import { getRelativeTimeString, getLondonHHMM } from "./time";
import { useNowTicking } from "./useNowTicking";

// How fresh the data on screen is: "10:33 · just now", and whether it's past
// DATA_STALE_THRESHOLD_MS. Shared by the status card's "Updated" line and the
// stale-data banners in the top bar.
//
// Both are worked out during render from lastUpdated and a ticking clock,
// not kept in state of their own. State set from an effect lags a render
// behind: the render where a refresh lands carried the new lastUpdated with
// the old "stale" flag, so the banner began to open just as the fetch that
// should have cleared it finished.
export const useFreshness = (lastUpdated: string | undefined) => {
  const now = useNowTicking(30 * 1000);

  const isStale = lastUpdated
    ? now.getTime() - new Date(lastUpdated).getTime() > DATA_STALE_THRESHOLD_MS
    : false;
  const relative = getRelativeTimeString(lastUpdated, now);

  // "Updated just now" alone reads as if this instant triggered a live fetch,
  // when it may just be a fast cache hit on data fetched slightly earlier -
  // pairing it with the clock time it was actually fetched keeps that honest.
  const clockTime = lastUpdated ? getLondonHHMM(new Date(lastUpdated)) : null;
  const freshnessText =
    clockTime && relative ? `${clockTime} · ${relative}` : relative;

  return { freshnessText, isStale };
};

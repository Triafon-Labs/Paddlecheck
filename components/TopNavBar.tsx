"use client";

import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Snackbar,
  Typography,
  Collapse,
  useScrollTrigger,
} from "@mui/material";
import Image from "next/image";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import ShareIcon from "@mui/icons-material/Share";
import SettingsModal from "./SettingsModal";
import { useKayakContext } from "@/lib/KayakDataContext";
import { OFFLINE_NO_CACHE_ERROR } from "@/lib/hooks";
import { degreesToCompass } from "@/lib/weather";
import { ragStatus, statusLabel } from "@/lib/rag";
import {
  THRESHOLDS,
  DATA_STALE_THRESHOLD_MS,
  CLUB_SHORT_NAME,
} from "@/lib/config";
import {
  formatRiverLevel,
  formatTemperature,
  formatWindSpeed,
} from "@/lib/units";
import { buildBestConditionsLine } from "@/lib/forecast";
import { getRelativeTimeString, getLondonHHMM } from "@/lib/time";
import { collapseMotion } from "@/lib/m3-palette";

// Filled with the saturated accent rather than the tonal container pair.
// The container roles would be the more orthodox M3 reading of a persistent
// inline strip, but they left the banner too quiet to notice - and the whole
// point of this strip is that the numbers below it may be stale.
const StatusBanner: React.FC<{
  severity: "warning" | "error";
  children: React.ReactNode;
}> = ({ severity, children }) => (
  <Box
    sx={{
      bgcolor: `${severity}.main`,
      color: `${severity}.contrastText`,
      py: 0.5,
      px: 2,
      textAlign: "center",
      fontSize: "0.75rem",
      fontWeight: 600,
      letterSpacing: "0.02em",
      borderBottom: "1px solid",
      borderColor: "divider",
    }}
  >
    {children}
  </Box>
);

const buildShareText = (
  conditions: ReturnType<typeof useKayakContext>["conditions"],
  forecastDays: ReturnType<typeof useKayakContext>["forecastDays"]
): string => {
  if (!conditions) return "Check current paddling conditions at Paddlecheck.";

  const lines: string[] = [];

  const emoji = ragStatus[conditions.overallStatus]?.emoji ?? "";
  lines.push(
    `🚦 *Overall Status:* ${statusLabel(conditions.overallStatus)} ${emoji}`
  );
  lines.push("");

  if (conditions.riverLevel !== undefined) {
    let riverLine = `🛶 *River Level:* ${formatRiverLevel(conditions.riverLevel)}`;
    if (conditions.levelChange !== undefined) {
      const { value, period } = conditions.levelChange;
      const arrow =
        value > THRESHOLDS.RIVER_LEVEL_TREND_THRESHOLD
          ? "⬆️"
          : value < -THRESHOLDS.RIVER_LEVEL_TREND_THRESHOLD
            ? "⬇️"
            : "➡️";
      riverLine += ` _(${arrow} ${formatRiverLevel(Math.abs(value))} in ${period})_`;
    }
    lines.push(riverLine);
  }

  if (
    conditions.launchMessage &&
    conditions.riverLevel !== undefined &&
    conditions.riverLevel >= THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_1
  ) {
    lines.push("");
    lines.push(conditions.launchMessage);
    lines.push("");
  }

  if (conditions.warnings && conditions.warnings.length > 0) {
    lines.push("⚠️ *Weather Warnings:*");
    const uniqueWarnings = Array.from(
      new Set(
        conditions.warnings.map((w) => `${w.severity} Warning: ${w.headline}`)
      )
    );
    uniqueWarnings.forEach((w) => {
      lines.push(`• ${w}`);
    });
    lines.push("");
  }

  const tempStr =
    conditions.temperature !== undefined
      ? `🌡️ *Temperature:* ${formatTemperature(conditions.temperature)}`
      : null;
  const windStr =
    conditions.windSpeed !== undefined
      ? `💨 *Wind:* ${formatWindSpeed(conditions.windSpeed)}${conditions.windDirection !== undefined ? ` ${degreesToCompass(conditions.windDirection)}` : ""}`
      : null;
  const weatherLine = [tempStr, windStr].filter(Boolean).join(" | ");
  if (weatherLine) lines.push(weatherLine);

  const bestConditions = buildBestConditionsLine(
    forecastDays,
    conditions.overallStatus,
    conditions.reasons
  );
  if (bestConditions) {
    lines.push("");
    lines.push(`🟢 *${bestConditions}*`);
  }

  return lines.join("\n");
};

const isDataStale = (lastUpdated: string | undefined): boolean => {
  if (!lastUpdated) return false;
  return Date.now() - new Date(lastUpdated).getTime() > DATA_STALE_THRESHOLD_MS;
};

const TopNavBar = () => {
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 8 });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const {
    refetch,
    conditions,
    forecastDays,
    isOffline,
    error,
    isRefreshing,
    lastFetchStale,
  } = useKayakContext();

  const isOfflineError = error === OFFLINE_NO_CACHE_ERROR;

  // Initialize state dynamically based on the current context value on render
  const [relativeLastUpdated, setRelativeLastUpdated] = useState<string>(() =>
    getRelativeTimeString(conditions?.lastUpdated)
  );
  const [isStale, setIsStale] = useState<boolean>(() =>
    isDataStale(conditions?.lastUpdated)
  );

  useEffect(() => {
    const dateStr = conditions?.lastUpdated;

    // Breaking synchronous context execution using queueMicrotask blocks cascading render lint rules
    queueMicrotask(() => {
      setRelativeLastUpdated(getRelativeTimeString(dateStr));
      setIsStale(isDataStale(dateStr));
    });

    const interval = setInterval(() => {
      setRelativeLastUpdated(getRelativeTimeString(dateStr));
      setIsStale(isDataStale(dateStr));
    }, 30000);

    return () => clearInterval(interval);
  }, [conditions?.lastUpdated]);

  // "Updated just now" alone reads as if this instant triggered a live fetch,
  // when it may just be a fast cache hit on data fetched slightly earlier -
  // pairing it with the clock time it was actually fetched keeps that honest.
  const lastUpdatedClockTime = conditions?.lastUpdated
    ? getLondonHHMM(new Date(conditions.lastUpdated))
    : null;
  const freshnessText =
    lastUpdatedClockTime && relativeLastUpdated
      ? `${lastUpdatedClockTime} · ${relativeLastUpdated}`
      : relativeLastUpdated;

  const handleShare = async () => {
    const text = buildShareText(conditions, forecastDays);
    // Give recipients a way back to the app - the summary alone has no link.
    const url = window.location.origin;
    // The link goes in the text rather than share()'s url field: apps like
    // WhatsApp join the two with a bare space, gluing it to the last line.
    const message = `${text}\n\n${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Paddlecheck", text: message });
      } else {
        await navigator.clipboard.writeText(message);
        setSnackbarOpen(true);
      }
    } catch (err) {
      // Dismissing the native share sheet rejects with AbortError - that's
      // a normal cancel, not a failure worth surfacing.
      if ((err as DOMException)?.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  };

  return (
    <>
      <Collapse in={isOffline} unmountOnExit {...collapseMotion}>
        <StatusBanner severity="warning">
          Offline
          {freshnessText
            ? ` – showing data from ${freshnessText}`
            : " – showing cached data"}
        </StatusBanner>
      </Collapse>
      {/* A stale cache is normally self-healed by a live re-fetch on load (see
          useKayakData), so this only fires once that attempt has actually
          finished - not while one may still be in flight. Stale data means
          one of two things, worded differently: the last fetch couldn't get
          anything newer (a failed update), or nothing has fetched since the
          data aged past the threshold - there is no background poll, so a
          page left open on screen gets here without anything failing, and
          "Live update failed" would claim a failure that never happened. */}
      <Collapse
        in={!isOffline && !isOfflineError && !isRefreshing && isStale}
        unmountOnExit
        {...collapseMotion}
      >
        <StatusBanner severity="warning">
          {lastFetchStale
            ? `Live update failed${freshnessText ? ` – showing data from ${freshnessText}` : ""}`
            : `Showing data from ${freshnessText} – refresh for the latest`}
        </StatusBanner>
      </Collapse>
      <Collapse in={isOfflineError} unmountOnExit {...collapseMotion}>
        <StatusBanner severity="error">{OFFLINE_NO_CACHE_ERROR}</StatusBanner>
      </Collapse>
      {/* M3's small top app bar carries no separator at rest and lifts a tonal
          step once content scrolls under it - the change *is* the signal that
          there's more above. This one wore a permanent border instead, which
          says the same thing whether or not anything is behind it.
          useScrollTrigger fires past 8px, before the first card reaches the
          bar.

          The two states are painted by the MuiAppBar override, which this only
          selects between - an sx colour here would be outranked in the dark
          scheme. See the note there. */}
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        data-scrolled={scrolled}
      >
        <Toolbar sx={{ justifyContent: "space-between", py: 0.75 }}>
          {/* minWidth: 0 lets this half shrink past its content on a narrow
              phone. Without it the title sets a floor on the flex item's
              width and the action buttons get pushed off the right edge
              instead - which globals.css's overflow-x: hidden then quietly
              clips. */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              minWidth: 0,
            }}
          >
            {/* A real vector (~30KB), so it's sharp at any pixel density.
                next/image serves .svg sources unoptimised automatically, which
                is what we want here - there's nothing to resize. */}
            <Image
              src="/favicon.svg"
              alt="Paddlecheck Logo"
              width={40}
              height={40}
              style={{ flexShrink: 0 }}
            />
            <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{ lineHeight: 1.25, fontWeight: 600 }}
              >
                {CLUB_SHORT_NAME}
              </Typography>
              <Typography
                variant="h6"
                noWrap
                // A step down from h6's 1.25rem so the three lines - club,
                // app, freshness - sit inside the bar with room to spare.
                sx={{ fontWeight: 600, lineHeight: 1.15, fontSize: "1.125rem" }}
                color="text.primary"
              >
                Paddlecheck
              </Typography>
              {(isRefreshing || freshnessText) && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ lineHeight: 1.2 }}
                >
                  {isRefreshing ? "Updating…" : `Updated ${freshnessText}`}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexShrink: 0 }}>
            <IconButton onClick={handleShare} aria-label="share">
              <ShareIcon />
            </IconButton>
            <IconButton
              onClick={() => setSettingsOpen(true)}
              aria-label="settings"
            >
              <SettingsIcon />
            </IconButton>
            <IconButton onClick={() => refetch()} aria-label="refresh">
              <RefreshIcon
                sx={{
                  animation: isRefreshing ? "spin 1s linear infinite" : "none",
                  "@keyframes spin": {
                    from: { transform: "rotate(0deg)" },
                    to: { transform: "rotate(360deg)" },
                  },
                }}
              />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2500}
        onClose={() => setSnackbarOpen(false)}
        message="Copied to clipboard"
        // Portalled to <body>, so it misses the safe-area frame in
        // app/layout.tsx. MUI rests it 8px off the bottom of the screen (24px
        // from sm up), which on an installed iOS app is inside the home
        // indicator - so re-declare both offsets with the inset added.
        sx={{
          bottom: {
            xs: "calc(8px + env(safe-area-inset-bottom))",
            sm: "calc(24px + env(safe-area-inset-bottom))",
          },
        }}
      />
    </>
  );
};

export default TopNavBar;

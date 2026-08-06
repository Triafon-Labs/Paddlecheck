"use client";

import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Snackbar,
  Typography,
} from "@mui/material";
import Image from "next/image";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import ShareIcon from "@mui/icons-material/Share";
import SettingsModal from "./SettingsModal";
import { useKayakContext } from "@/lib/KayakDataContext";
import { degreesToCompass } from "@/lib/weather";
import { ragStatus } from "@/lib/rag";
import { THRESHOLDS } from "@/lib/config";
import { formatRiverLevel, formatTemperature, formatWindSpeed } from "@/lib/units";
import {
  buildBestPaddlingTimes,
  buildNextDaytimeOutlook,
  hasDaylightRemaining,
} from "@/lib/forecast";
import { getRelativeTimeString, getLondonHHMM } from "@/lib/time";

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
      borderBottom: "1px solid rgba(0,0,0,0.08)",
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
  lines.push(`🚦 *Overall Status:* ${conditions.overallStatus} ${emoji}`);
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

  const todayForecast = forecastDays?.[0] ?? null;
  if (hasDaylightRemaining(todayForecast)) {
    const bestTimes = buildBestPaddlingTimes(
      todayForecast,
      conditions.overallStatus
    );
    if (bestTimes) {
      lines.push("");
      lines.push(`🟢 *${bestTimes.text}*`);
    }
  } else {
    const outlook = buildNextDaytimeOutlook(forecastDays);
    if (outlook && outlook.bestTimes) {
      // Format tomorrow's times directly as "🟢 *Best conditions tomorrow: ...*" or "🟢 *Best conditions later today: ...*"
      // instead of mentioning it is currently dark and outputting raw weather summary text.
      lines.push("");
      lines.push(`🟢 *Best conditions ${outlook.dayLabel}: ${outlook.bestTimes}*`);
    }
  }

  return lines.join("\n");
};

// Data older than this is flagged as stale regardless of why - a momentary
// blip that still leaves recent data on screen isn't worth alarming users
// over, but the underlying sources (server-side, cached for 15 minutes) have
// genuinely gone quiet for a while by this point.
const STALE_THRESHOLD_MS = 30 * 60 * 1000;

const isDataStale = (lastUpdated: string | undefined): boolean => {
  if (!lastUpdated) return false;
  return Date.now() - new Date(lastUpdated).getTime() > STALE_THRESHOLD_MS;
};

const TopNavBar = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const {
    refetch,
    conditions,
    forecastDays,
    isOffline,
    error,
    isRefreshing,
  } = useKayakContext();

  const isOfflineError =
    error === "Offline – no cached data (reconnect and refresh)";

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
      ? `${lastUpdatedClockTime} (${relativeLastUpdated})`
      : relativeLastUpdated;

  const handleShare = async () => {
    const text = buildShareText(conditions, forecastDays);
    if (navigator.share) {
      await navigator.share({ title: "Paddlecheck", text });
    } else {
      await navigator.clipboard.writeText(text);
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      {isOffline && (
        <StatusBanner severity="warning">
          Offline – showing cached data
          {freshnessText ? ` (updated ${freshnessText})` : ""}
        </StatusBanner>
      )}
      {!isOffline && !isOfflineError && isStale && (
        <StatusBanner severity="warning">
          Data may be out of date
          {freshnessText ? ` (updated ${freshnessText})` : ""}
        </StatusBanner>
      )}
      {isOfflineError && (
        <StatusBanner severity="error">
          Offline – no cached data (reconnect and refresh)
        </StatusBanner>
      )}
      <AppBar position="static" color="inherit" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Image
              src="/favicon.svg"
              alt="Paddlecheck Logo"
              width={40}
              height={40}
            />
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, lineHeight: 1.2 }}
                color="text.primary"
              >
                Paddlecheck
              </Typography>
              {(isRefreshing || freshnessText) && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ lineHeight: 1.2, mt: -0.2 }}
                >
                  {isRefreshing ? "Updating…" : `Updated ${freshnessText}`}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: "flex" }}>
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
              <RefreshIcon />
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
      />
    </>
  );
};

export default TopNavBar;

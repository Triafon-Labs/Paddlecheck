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
import {
  buildBestPaddlingTimes,
  buildNextDaytimeOutlook,
  hasDaylightRemaining,
} from "@/lib/forecast";

// Helper function to format the string outside of the hook mechanics
const getRelativeTimeString = (dateStr: string | undefined): string => {
  if (!dateStr) return "";
  const dateObj = new Date(dateStr);
  const diffMs = Date.now() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins === 1) return "1 minute ago";
  if (diffMins < 60) return `${diffMins} minutes ago`;

  const diffHours = Math.floor(diffMins / 60);
  return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
};

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
    let riverLine = `🛶 *River Level:* ${conditions.riverLevel.toFixed(2)}m`;
    if (conditions.levelChange !== undefined) {
      const { value, period } = conditions.levelChange;
      const arrow =
        value > THRESHOLDS.RIVER_LEVEL_TREND_THRESHOLD
          ? "⬆️"
          : value < -THRESHOLDS.RIVER_LEVEL_TREND_THRESHOLD
            ? "⬇️"
            : "➡️";
      riverLine += ` _(${arrow} ${Math.abs(value).toFixed(2)}m in ${period})_`;
    }
    lines.push(riverLine);
  }

  if (conditions.launchMessage) {
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
      ? `🌡️ *Temperature:* ${conditions.temperature.toFixed(1)}°C`
      : null;
  const windStr =
    conditions.windSpeed !== undefined
      ? `💨 *Wind:* ${conditions.windSpeed.toFixed(1)}mph${conditions.windDirection !== undefined ? ` ${degreesToCompass(conditions.windDirection)}` : ""}`
      : null;
  const weatherLine = [tempStr, windStr].filter(Boolean).join(" | ");
  if (weatherLine) lines.push(weatherLine);

  const todayForecast = forecastDays?.[0] ?? null;
  if (hasDaylightRemaining(todayForecast)) {
    const bestTimes = buildBestPaddlingTimes(todayForecast);
    if (bestTimes) {
      lines.push("");
      lines.push(`🟢 *${bestTimes}*`);
    }
  } else {
    const outlook = buildNextDaytimeOutlook(forecastDays);
    if (outlook) {
      const label =
        outlook.dayLabel.charAt(0).toUpperCase() + outlook.dayLabel.slice(1);
      lines.push("");
      lines.push(`🌙 _It's currently dark._`);
      lines.push(`*${label}:* ${outlook.rangesText}`);
      if (outlook.bestTimes) {
        lines.push(
          `🟢 *Best conditions ${outlook.dayLabel}: ${outlook.bestTimes}*`
        );
      }
    }
  }

  return lines.join("\n");
};

const TopNavBar = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { refetch, conditions, forecastDays, isOffline, error } =
    useKayakContext();

  const isOfflineError =
    error === "Offline - no cached data (reconnect and refresh)";

  // Initialize state dynamically based on the current context value on render
  const [relativeLastUpdated, setRelativeLastUpdated] = useState<string>(() =>
    getRelativeTimeString(conditions?.lastUpdated)
  );

  useEffect(() => {
    const dateStr = conditions?.lastUpdated;

    // Breaking synchronous context execution using queueMicrotask blocks cascading render lint rules
    queueMicrotask(() => {
      setRelativeLastUpdated(getRelativeTimeString(dateStr));
    });

    const interval = setInterval(() => {
      setRelativeLastUpdated(getRelativeTimeString(dateStr));
    }, 30000);

    return () => clearInterval(interval);
  }, [conditions?.lastUpdated]);

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
        <Box
          sx={{
            bgcolor: "warning.main",
            color: "warning.contrastText",
            py: 0.5,
            px: 2,
            textAlign: "center",
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.02em",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          Offline - showing cached data
          {relativeLastUpdated ? ` (updated ${relativeLastUpdated})` : ""}
        </Box>
      )}
      {isOfflineError && (
        <Box
          sx={{
            bgcolor: "error.main",
            color: "error.contrastText",
            py: 0.5,
            px: 2,
            textAlign: "center",
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.02em",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          Offline - no cached data (reconnect and refresh)
        </Box>
      )}
      <AppBar position="static" color="inherit" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Image
              src="/favicon.svg"
              alt="Paddlecheck Logo"
              width={40}
              height={40}
            />
            <Typography
              variant="h6"
              sx={{ fontWeight: 600 }}
              color="text.primary"
            >
              Paddlecheck
            </Typography>
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

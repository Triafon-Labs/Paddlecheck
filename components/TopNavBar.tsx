"use client";

import React, { useState } from "react";
import { AppBar, Toolbar, IconButton, Box, Snackbar, Typography } from "@mui/material";
import Image from "next/image";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import ShareIcon from "@mui/icons-material/Share";
import SettingsModal from "./SettingsModal";
import { useKayakContext } from "@/lib/KayakDataContext";
import { degreesToCompass } from "@/lib/weather";
import { ragStatus } from "@/lib/rag";
import { DayForecast, Status } from "@/types";

const buildBestPaddlingTimes = (todayForecast: DayForecast | null): string | null => {
  if (!todayForecast) return null;

  const now = new Date();
  const currentHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const futureSlots = todayForecast.graphData.filter((pt) => pt.time >= currentHHMM);
  if (futureSlots.length === 0) return null;

  const preferredStatuses: Status[] = ["Light Green", "Dark Green"];
  let bestStatus: Status | null = null;
  for (const s of preferredStatuses) {
    if (futureSlots.some((pt) => pt.status === s)) {
      bestStatus = s;
      break;
    }
  }
  if (!bestStatus) return null;

  const windows: { start: string; end: string }[] = [];
  let windowStart: string | null = null;
  let lastTime: string | null = null;

  for (const pt of futureSlots) {
    if (pt.status === bestStatus) {
      if (windowStart === null) windowStart = pt.time;
      lastTime = pt.time;
    } else {
      if (windowStart !== null && lastTime !== null) {
        windows.push({ start: windowStart, end: lastTime });
        windowStart = null;
        lastTime = null;
      }
    }
  }
  if (windowStart !== null && lastTime !== null) {
    windows.push({ start: windowStart, end: lastTime });
  }

  if (windows.length === 0) return null;

  const label = bestStatus === "Light Green" ? "light green" : "dark green";
  const ranges = windows.map((w) => `${w.start}–${w.end}`).join(", ");
  return `🟢 *Best Conditions:* ${ranges} (${label})`;
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
      const arrow = value > 0.01 ? "⬆️" : value < -0.01 ? "⬇️" : "➡️";
      riverLine += ` _(${arrow} ${Math.abs(value).toFixed(2)}m in ${period})_`;
    }
    lines.push(riverLine);
  }

  if (conditions.launchMessage) {
    lines.push("");
    lines.push(conditions.launchMessage);
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
  const bestTimes = buildBestPaddlingTimes(todayForecast);
  if (bestTimes) {
    lines.push("");
    lines.push(bestTimes);
  }

  return lines.join("\n");
};

const TopNavBar = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { refetch, conditions, forecastDays } = useKayakContext();

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
            <IconButton onClick={() => setSettingsOpen(true)} aria-label="settings">
              <SettingsIcon />
            </IconButton>
            <IconButton onClick={() => refetch()} aria-label="refresh">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
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

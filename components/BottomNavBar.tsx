"use client";

import React, { useState } from "react";
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Snackbar,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import LinkIcon from "@mui/icons-material/Link";
import ShareIcon from "@mui/icons-material/Share";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SettingsModal from "./SettingsModal";
import LinksPopover from "./LinksPopover";
import WeatherLegendModal from "./WeatherLegendModal";
import { useKayakContext } from "@/lib/KayakDataContext";
import { degreesToCompass } from "@/lib/weather";
import { ragStatus } from "@/lib/rag";
import { DayForecast, Status } from "@/types";

const buildBestPaddlingTimes = (todayForecast: DayForecast | null): string | null => {
  if (!todayForecast) return null;

  const now = new Date();
  const currentHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Only consider future slots
  const futureSlots = todayForecast.graphData.filter((pt) => pt.time >= currentHHMM);
  if (futureSlots.length === 0) return null;

  // Find the best available status (Light Green > Dark Green)
  const preferredStatuses: Status[] = ["Light Green", "Dark Green"];
  let bestStatus: Status | null = null;
  for (const s of preferredStatuses) {
    if (futureSlots.some((pt) => pt.status === s)) {
      bestStatus = s;
      break;
    }
  }
  if (!bestStatus) return null;

  // Collect contiguous windows of the best status
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

const BottomNavBar = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [linksAnchorEl, setLinksAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { refetch, conditions, forecastDays } = useKayakContext();

  const handleLinksClick = (event: React.MouseEvent<HTMLElement>) => {
    setLinksAnchorEl(event.currentTarget);
  };

  const handleLinksClose = () => {
    setLinksAnchorEl(null);
  };

  const linksOpen = Boolean(linksAnchorEl);

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

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
      <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: "background.paper",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        elevation={0}
      >
        <BottomNavigation showLabels>
          <BottomNavigationAction
            label="Refresh"
            icon={<RefreshIcon />}
            onClick={() => refetch()}
          />
          <BottomNavigationAction
            label="Settings"
            icon={<SettingsIcon />}
            onClick={() => setSettingsOpen(true)}
          />
          <BottomNavigationAction
            label="Legend"
            icon={<InfoOutlinedIcon />}
            onClick={() => setLegendOpen(true)}
          />
          <BottomNavigationAction
            label="Links"
            icon={<LinkIcon />}
            onClick={handleLinksClick}
          />
          <BottomNavigationAction
            label="Share"
            icon={<ShareIcon />}
            onClick={handleShare}
          />
        </BottomNavigation>
      </Paper>
      <SettingsModal open={settingsOpen} onClose={handleSettingsClose} />
      <WeatherLegendModal open={legendOpen} onClose={() => setLegendOpen(false)} />
      <LinksPopover
        open={linksOpen}
        anchorEl={linksAnchorEl}
        onClose={handleLinksClose}
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

export default BottomNavBar;

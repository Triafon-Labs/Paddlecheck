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
import SettingsModal from "./SettingsModal";
import LinksPopover from "./LinksPopover";
import { useKayakContext } from "@/lib/KayakDataContext";
import { degreesToCompass } from "@/lib/weather";

const buildShareText = (
  conditions: ReturnType<typeof useKayakContext>["conditions"]
): string => {
  if (!conditions) return "Check current paddling conditions at Paddlecheck.";
  const statusEmojis: Record<string, string> = {
    "Light Green": "✅",
    "Dark Green": "📈",
    Amber: "⚠️",
    Red: "🚨",
    "No Paddling": "⛔",
    Unknown: "🤷",
  };
  const emoji = statusEmojis[conditions.overallStatus] ?? "";
  const trend =
    conditions.levelChange?.value !== undefined
      ? conditions.levelChange.value > 0.01
        ? " rising"
        : conditions.levelChange.value < -0.01
          ? " falling"
          : " steady"
      : "";
  const wind =
    conditions.windSpeed !== undefined
      ? `Wind: ${conditions.windSpeed.toFixed(0)} mph${conditions.windDirection !== undefined ? ` ${degreesToCompass(conditions.windDirection)}` : ""}`
      : null;
  const temp =
    conditions.temperature !== undefined
      ? `Temp: ${conditions.temperature.toFixed(0)}°C`
      : null;
  const river =
    conditions.riverLevel !== undefined
      ? `River: ${conditions.riverLevel.toFixed(2)}m${trend}`
      : null;

  const lines = [
    `🏄 Paddlecheck – Worcester Canoe Club`,
    `Status: ${emoji} ${conditions.overallStatus}`,
    river,
    [wind, temp].filter(Boolean).join(" | "),
  ].filter(Boolean);

  return lines.join("\n");
};

const BottomNavBar = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [linksAnchorEl, setLinksAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { refetch, conditions } = useKayakContext();

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
    const text = buildShareText(conditions);
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

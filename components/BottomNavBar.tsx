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
import { ragStatus } from "@/lib/rag";

const buildShareText = (
  conditions: ReturnType<typeof useKayakContext>["conditions"]
): string => {
  if (!conditions) return "Check current paddling conditions at Paddlecheck.";

  const lines: string[] = [];

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

  lines.push("");
  const emoji = ragStatus[conditions.overallStatus]?.emoji ?? "";
  lines.push(`🚦 *Overall Status:* ${conditions.overallStatus} ${emoji}`);

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

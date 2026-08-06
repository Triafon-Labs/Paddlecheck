"use client";

import React from "react";
import { Paper, SxProps, Theme } from "@mui/material";

interface InfoPanelProps {
  children: React.ReactNode;
  align?: "center" | "flex-start";
  sx?: SxProps<Theme>;
}

// Shared wrapper for the "icon + text on a muted background" panels used
// across StatusCard, ConditionsBriefing and WeatherWarnings, so the same
// padding/spacing/background doesn't get hand-duplicated at each call site.
const InfoPanel: React.FC<InfoPanelProps> = ({ children, align = "center", sx }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.5,
      display: "flex",
      alignItems: align,
      gap: 1,
      backgroundColor: "action.hover",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

export default InfoPanel;

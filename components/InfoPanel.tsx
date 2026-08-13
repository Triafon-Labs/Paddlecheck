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
//
// The background is the tonal surfaceContainerHigh role, one step up from the
// card these sit inside. It used to be `action.hover`, which is a state layer
// - an overlay M3 reserves for expressing interaction - so a resting panel
// was painted in the colour that means "you are hovering this".
const InfoPanel: React.FC<InfoPanelProps> = ({
  children,
  align = "center",
  sx,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.5,
      display: "flex",
      alignItems: align,
      gap: 1,
      backgroundColor: "surfaces.containerHigh",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

export default InfoPanel;

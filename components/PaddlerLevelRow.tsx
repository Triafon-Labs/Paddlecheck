"use client";

import React from "react";
import { Box, Collapse, Typography } from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { PaddlerType, PaddlingStatus } from "@/types";
import { hasDetailsToShow } from "@/lib/paddlingMatrix";
import { collapseMotion, m3Spring, spring } from "@/lib/m3-palette";
import {
  StatusFace,
  PADDLING_STATUS_UI,
  UNKNOWN_PADDLING_UI,
} from "./StatusFace";

interface PaddlerLevelRowProps {
  paddler: PaddlerType;
  statusInfo?: PaddlingStatus;
  open: boolean;
  onToggle: () => void;
  // Off for a copy that only reserves space (the forecast panel's invisible
  // hours): its list just shows or hides, rather than every copy animating.
  animate?: boolean;
  // Called once the list has finished opening or closing.
  onSettled?: () => void;
  // The forecast panel's size, matching the compact rows around it
  // (CompactReadingRow): the same text, with tighter padding and a smaller
  // face and chevron.
  compact?: boolean;
}

// One level's verdict as a row: face, level, verdict, and a chevron that
// opens the rules behind it. Who Can Paddle lists every level this way, and
// the forecast hour shows the reader's own, so the two look the same.
const PaddlerLevelRow: React.FC<PaddlerLevelRowProps> = ({
  paddler,
  statusInfo,
  open,
  onToggle,
  animate = true,
  onSettled,
  compact,
}) => {
  const iconSize = compact ? 16 : 20;
  const ui = statusInfo
    ? PADDLING_STATUS_UI[statusInfo.status]
    : UNKNOWN_PADDLING_UI;
  // A row with nothing more to show isn't a button: no chevron, no state
  // layer, nothing to open. A spacer keeps its label in line with the rest.
  const expandable = !!statusInfo && hasDetailsToShow(statusInfo.details);
  const isOpen = expandable && open;
  const list = expandable && (
    <Box
      component="ul"
      sx={{
        m: 0,
        pl: compact ? 4 : 4.5,
        pr: 1.5,
        pt: compact ? 0 : 0.5,
        pb: compact ? 1 : 1.5,
        "& li:not(:last-of-type)": { mb: compact ? 0.25 : 0.75 },
      }}
    >
      {statusInfo.details.map((line, index) => (
        <Typography key={index} component="li" variant="body2">
          {line}
        </Typography>
      ))}
    </Box>
  );
  return (
    <Box
      sx={{
        backgroundColor: "surfaces.containerHigh",
        borderRadius: compact ? 1 : 1.5,
        overflow: "hidden",
      }}
    >
      <Box
        {...(expandable && {
          onClick: onToggle,
          role: "button",
          tabIndex: 0,
          "aria-expanded": isOpen,
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle();
            }
          },
        })}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: compact ? 0.75 : 1,
          cursor: expandable ? "pointer" : "default",
          position: "relative",
          // These rows are real buttons (click, Enter/Space, aria-expanded)
          // and carry the M3 onSurface state layer at 8%/10% plus a focus
          // indicator, so a keyboard user can tell which row they are on.
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundColor: "text.primary",
            opacity: 0,
            transition: spring("opacity", m3Spring.effectsFast),
            pointerEvents: "none",
          },
          ...(expandable && {
            "&:hover::after": { opacity: 0.08 },
            "&:active::after": { opacity: 0.1 },
          }),
          "&:focus-visible": {
            outline: "3px solid",
            outlineColor: "primary.main",
            outlineOffset: -3,
          },
        }}
      >
        <StatusFace
          face={ui.face}
          color={ui.color}
          onColor={ui.onColor}
          size={iconSize}
        />
        <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
          {paddler}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {ui.short}
        </Typography>
        {expandable ? (
          <ExpandMore
            sx={{
              fontSize: iconSize,
              color: "text.secondary",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: spring("transform", m3Spring.spatialFast),
            }}
          />
        ) : (
          <Box sx={{ width: iconSize, flexShrink: 0 }} aria-hidden />
        )}
      </Box>
      {animate ? (
        <Collapse
          in={isOpen}
          timeout="auto"
          unmountOnExit
          easing={collapseMotion.easing}
          onEntered={onSettled}
          onExited={onSettled}
        >
          {list}
        </Collapse>
      ) : (
        isOpen && list
      )}
    </Box>
  );
};

export default PaddlerLevelRow;

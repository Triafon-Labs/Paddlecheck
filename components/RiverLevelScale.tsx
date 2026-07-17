"use client";

import React from "react";
import { Card, CardContent, Typography, Box, CircularProgress } from "@mui/material";
import { Status } from "@/types";
import { ragStatus, LEVEL_DESCRIPTIONS } from "@/lib/rag";

interface RiverLevelScaleProps {
  riverLevel?: number;
  overallStatus?: Status;
  loading?: boolean;
}

interface ScaleRow {
  level: number;
  desc: string;
  current: boolean;
}

const RiverLevelScale: React.FC<RiverLevelScaleProps> = ({
  riverLevel,
  overallStatus,
  loading,
}) => {
  if (loading) {
    return (
      <Card variant="outlined" sx={{ width: "100%", p: 2 }}>
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom>
            Level Scale
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (riverLevel === undefined) return null;

  const levels = Object.entries(LEVEL_DESCRIPTIONS)
    .map(([level, desc]) => ({ level: parseFloat(level), desc }))
    .sort((a, b) => a.level - b.level);

  const below = levels
    .filter((l) => l.level <= riverLevel)
    .slice(-2)
    .reverse(); // nearest-below first, descending
  const above = levels
    .filter((l) => l.level > riverLevel)
    .slice(0, 2)
    .reverse(); // furthest-above first, descending

  const markerColor = overallStatus
    ? ragStatus[overallStatus].color
    : ragStatus.Unknown.color;

  // Highlight whichever visible landmark is numerically closest to the
  // current reading, rather than inserting a separate "current" row.
  const nearestAbove = above[above.length - 1] ?? null; // last = nearest-above
  const nearestBelow = below[0] ?? null; // first = nearest-below
  const nearestLevel =
    nearestAbove && nearestBelow
      ? riverLevel - nearestBelow.level <= nearestAbove.level - riverLevel
        ? nearestBelow.level
        : nearestAbove.level
      : (nearestBelow ?? nearestAbove)?.level;

  const rows: ScaleRow[] = [...above, ...below].map((l) => ({
    ...l,
    current: l.level === nearestLevel,
  }));

  return (
    <Card variant="outlined" sx={{ width: "100%", p: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Level Scale
        </Typography>
        <Box sx={{ mt: 1 }}>
          {rows.map((row, i) => (
            <Box
              key={`${row.level}-${i}`}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                py: 1,
                ...(row.current && {
                  backgroundColor: "action.hover",
                  borderRadius: 1,
                }),
              }}
            >
              <Box
                sx={{
                  width: 56,
                  flexShrink: 0,
                  textAlign: "right",
                  pr: 1.5,
                  pt: "1px",
                  fontWeight: row.current ? 700 : 400,
                  fontSize: "0.875rem",
                }}
              >
                {row.level.toFixed(2)}m
              </Box>
              <Box
                sx={{
                  width: 16,
                  flexShrink: 0,
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  alignSelf: "stretch",
                }}
              >
                {i > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      height: "50%",
                      width: "2px",
                      backgroundColor: "divider",
                    }}
                  />
                )}
                {i < rows.length - 1 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      height: "50%",
                      width: "2px",
                      backgroundColor: "divider",
                    }}
                  />
                )}
                <Box
                  sx={{
                    position: "absolute",
                    top: "7px",
                    width: row.current ? 12 : 8,
                    height: row.current ? 12 : 8,
                    borderRadius: "50%",
                    backgroundColor: row.current ? markerColor : "text.disabled",
                    boxShadow: row.current ? `0 0 0 3px ${markerColor}33` : "none",
                    zIndex: 1,
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, pl: 1.5 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: row.current ? 700 : 400 }}
                >
                  {row.desc}
                </Typography>
                {row.current && (
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", fontStyle: "italic" }}
                  >
                    Currently {riverLevel.toFixed(2)}m
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RiverLevelScale;

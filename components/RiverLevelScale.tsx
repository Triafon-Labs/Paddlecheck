"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
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

// Horizontal center of the tick column, from the container's left edge
// (56px level-label column + 8px half-width of the 16px tick column).
const TICK_CENTER_X = 64;

// Vertical center of the tick dot within its row (top: 7px + half of its
// 8px height). Line segments anchor here rather than at 50% of the row's
// height, since rows vary in height (multi-line descriptions, the extra
// "Currently Xm" caption) but the dot's own offset from the row top never
// changes - anchoring to row-height percentage would misalign the line
// with the dot on any row taller than the others.
const TICK_DOT_CENTER = 11;

const RiverLevelScale: React.FC<RiverLevelScaleProps> = ({
  riverLevel,
  overallStatus,
  loading,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [markerTop, setMarkerTop] = useState<number | null>(null);

  const levels =
    riverLevel !== undefined
      ? Object.entries(LEVEL_DESCRIPTIONS)
          .map(([level, desc]) => ({ level: parseFloat(level), desc }))
          .sort((a, b) => a.level - b.level)
      : [];

  const below =
    riverLevel !== undefined
      ? levels
          .filter((l) => l.level <= riverLevel)
          .slice(-2)
          .reverse() // nearest-below first, descending
      : [];
  const above =
    riverLevel !== undefined
      ? levels
          .filter((l) => l.level > riverLevel)
          .slice(0, 2)
          .reverse() // furthest-above first, descending
      : [];

  // The two landmarks immediately bounding the current reading (if they
  // exist within the visible window) - used both to pick which row's text
  // to highlight and to interpolate the floating marker's position.
  const nearestAbove = above[above.length - 1] ?? null;
  const nearestBelow = below[0] ?? null;
  const nearestLevel =
    riverLevel !== undefined
      ? nearestAbove && nearestBelow
        ? riverLevel - nearestBelow.level <= nearestAbove.level - riverLevel
          ? nearestBelow.level
          : nearestAbove.level
        : (nearestBelow ?? nearestAbove)?.level
      : undefined;

  const rows: ScaleRow[] = [...above, ...below].map((l) => ({
    ...l,
    current: l.level === nearestLevel,
  }));

  useLayoutEffect(() => {
    if (riverLevel === undefined || !containerRef.current) {
      setMarkerTop(null);
      return;
    }
    const containerTop = containerRef.current.getBoundingClientRect().top;
    const centerOf = (level: number) => {
      const el = rowRefs.current.get(level);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return rect.top + rect.height / 2 - containerTop;
    };

    const aboveCenter = nearestAbove ? centerOf(nearestAbove.level) : null;
    const belowCenter = nearestBelow ? centerOf(nearestBelow.level) : null;

    if (
      aboveCenter !== null &&
      belowCenter !== null &&
      nearestAbove &&
      nearestBelow
    ) {
      // Interpolate between the two bounding rows' centers, proportional to
      // how close the reading is to each one.
      const frac =
        (nearestAbove.level - riverLevel) /
        (nearestAbove.level - nearestBelow.level);
      setMarkerTop(aboveCenter + frac * (belowCenter - aboveCenter));
    } else {
      // Off one end of the recorded scale - no second bound to interpolate
      // against, so sit on the single nearest row instead.
      setMarkerTop(aboveCenter ?? belowCenter);
    }
    // `loading` is included so the transition from the spinner branch (where
    // containerRef never attaches) to the real content re-triggers this even
    // when riverLevel/nearestAbove/nearestBelow happen to be unchanged - e.g.
    // cached data already matches the freshly-fetched reading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riverLevel, nearestAbove?.level, nearestBelow?.level, rows.length, loading]);

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

  const markerColor = overallStatus
    ? ragStatus[overallStatus].color
    : ragStatus.Unknown.color;

  return (
    <Card variant="outlined" sx={{ width: "100%", p: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Level Scale
        </Typography>
        <Box ref={containerRef} sx={{ mt: 1, position: "relative" }}>
          {markerTop !== null && (
            <Box
              sx={{
                position: "absolute",
                left: TICK_CENTER_X,
                top: markerTop,
                transform: "translate(-50%, -50%)",
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: markerColor,
                border: "2px solid",
                borderColor: "background.paper",
                boxShadow: `0 0 0 3px ${markerColor}55`,
                zIndex: 2,
              }}
            />
          )}
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
                      height: `${TICK_DOT_CENTER}px`,
                      width: "2px",
                      backgroundColor: "divider",
                    }}
                  />
                )}
                {i < rows.length - 1 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: `${TICK_DOT_CENTER}px`,
                      bottom: 0,
                      width: "2px",
                      backgroundColor: "divider",
                    }}
                  />
                )}
                <Box
                  ref={(el: HTMLDivElement | null) => {
                    if (el) rowRefs.current.set(row.level, el);
                    else rowRefs.current.delete(row.level);
                  }}
                  sx={{
                    position: "absolute",
                    top: "7px",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "text.disabled",
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

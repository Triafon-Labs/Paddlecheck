"use client";

import React from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import { LEVEL_DESCRIPTIONS } from "@/lib/rag";
import { formatRiverLevel } from "@/lib/units";

interface RiverLevelLandmarksProps {
  riverLevel: number;
  dataAgeLabel: string | null;
}

interface ScaleRow {
  level: number;
  desc: string;
  isReading: boolean; // the highlighted row, at the live reading
  onLandmark?: boolean; // the reading row is a landmark the river is sitting on
}

// Vertical center of the tick dot within its row: the row's 8px top padding,
// then 7px + half of the dot's 8px height. The padding lives on the text
// columns rather than the row, so the dot column runs the row's full height
// and the line joins up from one row to the next. Segments anchor here rather
// than at 50% of the row's height, since rows vary in height (multi-line
// descriptions) but the dot's own offset from the row top never changes.
const TICK_DOT_CENTER = 19;

// The line is drawn like an M3 linear progress indicator stood on end: a 4dp
// rounded track, filled in primary from the bottom up to the reading, so the
// landmarks below it read as under water.
const TRACK_WIDTH = 4;

// How far a landmark is from the reading, in metres like the levels beside it.
const formatDistance = (metres: number): string =>
  `${formatRiverLevel(Math.abs(metres))} ${metres > 0 ? "above" : "below"}`;

// The reading on a short scale of the club's landmarks either side of it.
const RiverLevelLandmarks: React.FC<RiverLevelLandmarksProps> = ({
  riverLevel,
  dataAgeLabel,
}) => {
  const levels = Object.entries(LEVEL_DESCRIPTIONS)
    .map(([level, desc]) => ({ level: parseFloat(level), desc }))
    .sort((a, b) => a.level - b.level);

  // A landmark the river is sitting on, to the centimetre shown, is
  // highlighted itself rather than given a separate "Current level" row
  // beside it - the level on that row is then the river's own either way.
  const onLandmark = levels.find((l) => Math.abs(l.level - riverLevel) < 0.005);

  // The nearest landmark either side, however far away: with its distance
  // shown, even a far one says how much the river has to rise or fall.
  const others = levels.filter((l) => l !== onLandmark);
  const below = others.filter((l) => l.level < riverLevel).slice(-1);
  const above = others.filter((l) => l.level > riverLevel).slice(0, 1);

  const rows: ScaleRow[] = [
    ...above.map((l) => ({ ...l, isReading: false })),
    onLandmark
      ? { ...onLandmark, isReading: true, onLandmark: true }
      : { level: riverLevel, desc: "Current level", isReading: true },
    ...below.map((l) => ({ ...l, isReading: false })),
  ];

  const readingIndex = rows.findIndex((r) => r.isReading);
  const segment = (filled: boolean) =>
    ({
      position: "absolute",
      width: `${TRACK_WIDTH}px`,
      backgroundColor: filled ? "primary.main" : "divider",
    }) as const;

  return (
    <Box sx={{ mt: 1 }}>
      {rows.map((row, i) => (
        <Box
          key={`${row.level}-${i}`}
          sx={{
            display: "flex",
            alignItems: "flex-start",
            px: 1.5,
            ...(row.isReading && {
              backgroundColor: "surfaces.containerHigh",
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
              pt: "9px",
              pb: 1,
              fontSize: "0.875rem",
            }}
          >
            {formatRiverLevel(row.level)}
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
            {i > 0 ? (
              <Box
                sx={{
                  ...segment(i > readingIndex),
                  top: 0,
                  height: `${TICK_DOT_CENTER}px`,
                }}
              />
            ) : (
              // Rounded cap at the top of the track.
              <Box
                sx={{
                  ...segment(i > readingIndex),
                  top: `${TICK_DOT_CENTER - TRACK_WIDTH}px`,
                  height: `${TRACK_WIDTH}px`,
                  borderRadius: `${TRACK_WIDTH}px ${TRACK_WIDTH}px 0 0`,
                }}
              />
            )}
            {/* The track stops at the bottom dot: below the lowest landmark
                shown there is nothing to measure against. */}
            {i < rows.length - 1 && (
              <Box
                sx={{
                  ...segment(i >= readingIndex),
                  top: `${TICK_DOT_CENTER}px`,
                  bottom: 0,
                }}
              />
            )}
            <Box
              sx={{
                position: "absolute",
                top: `${TICK_DOT_CENTER - (row.isReading ? 6 : 5)}px`,
                width: row.isReading ? 12 : 10,
                height: row.isReading ? 12 : 10,
                boxSizing: "border-box",
                borderRadius: "50%",
                // Primary rather than a status colour: the status pill above
                // already says how safe it is, and a RAG dot here either
                // repeated it or, coloured by the river alone, contradicted it.
                // Landmarks above the water are empty rings on the track, and
                // those below are solid, a little wider than the fill so they
                // still read as dots on it.
                ...(i < readingIndex
                  ? {
                      backgroundColor: "surfaces.container",
                      border: 2,
                      borderColor: "divider",
                    }
                  : { backgroundColor: "primary.main" }),
                boxShadow: (theme) =>
                  row.isReading
                    ? `0 0 0 3px rgba(${(theme.vars ?? theme).palette.primary.mainChannel} / 0.2)`
                    : "none",
                zIndex: 1,
              }}
            />
          </Box>
          <Box sx={{ flex: 1, pl: 1.5, py: 1 }}>
            <Typography
              variant="body2"
              sx={{
                // Medium, like the card's section labels: enough to set the
                // reading apart from the landmarks without a style (italics)
                // nothing else on the page uses.
                fontWeight: row.isReading ? 500 : 400,
                // "Current level" has no descenders (g/j/p/q/y), so its
                // glyphs sit visibly higher within the line box than text
                // that does - nudge down to read as centered against the
                // dot and level number, which don't have this effect.
                ...(row.isReading && !row.onLandmark && { mt: "1px" }),
              }}
            >
              {row.desc}
              {row.isReading && !row.onLandmark && dataAgeLabel && (
                <Typography
                  component="span"
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 400,
                    ml: 0.5,
                  }}
                >
                  ({dataAgeLabel})
                </Typography>
              )}
            </Typography>
            {(row.onLandmark || !row.isReading) && (
              <Typography variant="caption" color="text.secondary">
                {row.onLandmark
                  ? `Current level${dataAgeLabel ? ` (${dataAgeLabel})` : ""}`
                  : formatDistance(row.level - riverLevel)}
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

// The loading shape of the scale: a landmark either side of a highlighted
// current-level row, the commonest layout, on the same column widths.
const LandmarkRowSkeleton: React.FC = () => (
  <Box sx={{ display: "flex", px: 1.5, py: 1 }}>
    <Box sx={{ width: 56, flexShrink: 0, pr: 1.5, pt: "1px" }}>
      <Skeleton
        variant="text"
        width={40}
        sx={{ ml: "auto" }}
        animation="wave"
      />
    </Box>
    <Box
      sx={{
        width: 16,
        flexShrink: 0,
        display: "flex",
        justifyContent: "center",
        pt: "6px",
      }}
    >
      <Skeleton variant="circular" width={10} height={10} animation="wave" />
    </Box>
    <Box sx={{ flex: 1, pl: 1.5 }}>
      <Skeleton variant="text" width="90%" animation="wave" />
      <Skeleton variant="text" width="65%" animation="wave" />
      <Skeleton variant="text" width={80} height={16} animation="wave" />
    </Box>
  </Box>
);

export const RiverLevelLandmarksSkeleton: React.FC = () => (
  <Box sx={{ mt: 1 }}>
    <LandmarkRowSkeleton />
    <Skeleton
      variant="rounded"
      height={39}
      animation="wave"
      sx={{ borderRadius: 1 }}
    />
    <LandmarkRowSkeleton />
  </Box>
);

export default RiverLevelLandmarks;

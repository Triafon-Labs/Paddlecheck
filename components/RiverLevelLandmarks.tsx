"use client";

import React from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import { LEVEL_DESCRIPTIONS } from "@/lib/rag";
import { formatRiverLevel } from "@/lib/units";

interface RiverLevelLandmarksProps {
  riverLevel: number;
  // Shown under the reading's own row: how old it is, or where a forecast
  // level comes from.
  readingNote: string | null;
  // The forecast panel's size: the same scale a size down (COMPACT_SIZE),
  // so a forecast hour reads as secondary to the current status.
  compact?: boolean;
  // What the reading's own row is called - "Forecast level" for an hour
  // ahead.
  readingLabel?: string;
}

interface ScaleRow {
  level: number;
  desc: string;
  isReading: boolean; // the highlighted row, at the live reading
  onLandmark?: boolean; // the reading row is a landmark the river is sitting on
}

// The scale's measurements, in px. The status card uses FULL_SIZE and a
// forecast hour COMPACT_SIZE - the same look with smaller elements and
// tighter rows, so a forecast hour reads as a mini version of the current
// status. Its text stays the size of the rest of the app's.
interface ScaleSize {
  // Width of the level figures' column.
  levelWidth: number;
  // Padding above and below each row's text. It lives on the text columns
  // rather than the row, so the dot column runs the row's full height and
  // the line joins up from one row to the next.
  rowPad: number;
  // Vertical center of the tick dot within its row: the row's top padding,
  // then half of the first line of text. Segments anchor here rather than at
  // 50% of the row's height, since rows vary in height (multi-line
  // descriptions) but the dot's own offset from the row top never changes.
  dotCenter: number;
  // The line is drawn like an M3 linear progress indicator stood on end: a
  // rounded track, filled in primary from the bottom up to the reading, so
  // the landmarks below it read as under water.
  track: number;
  dot: number;
  readingDot: number;
  // The reading dot's halo.
  halo: number;
  levelFontSize: string;
  // Type for the compact scale only: the line height (px) the level figures
  // share with the text beside them so they sit on its first line, and the
  // text and note font sizes.
  text?: { line: number; desc: string; note: string };
}

const FULL_SIZE: ScaleSize = {
  levelWidth: 56,
  rowPad: 8,
  dotCenter: 19,
  track: 4,
  dot: 10,
  readingDot: 12,
  halo: 3,
  levelFontSize: "0.875rem",
};

const COMPACT_SIZE: ScaleSize = {
  levelWidth: 48,
  rowPad: 3,
  // rowPad, then half of text.line.
  dotCenter: 13,
  track: 3,
  dot: 8,
  readingDot: 10,
  halo: 2,
  levelFontSize: "0.8125rem",
  // The theme's body2 and caption sizes, with tighter line spacing.
  text: { line: 19, desc: "0.875rem", note: "0.75rem" },
};

// How far a landmark is from the reading, in metres like the levels beside it.
const formatDistance = (metres: number): string =>
  `${formatRiverLevel(Math.abs(metres))} ${metres > 0 ? "above" : "below"}`;

// One reading in the forecast panel's size: an icon, then the reading and a
// note beneath it. The forecast hour's river level, weather and
// contributing factors all use it, so every row lines up - an icon column
// rather than a figure column, which left short figures indented and icons
// floating in a gap.
export const CompactReadingRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  note?: string | null;
}> = ({ icon, label, note }) => (
  <Box
    sx={{
      mt: 0.5,
      display: "flex",
      alignItems: "flex-start",
      gap: 1,
      px: 1.5,
      py: 0.5,
      backgroundColor: "surfaces.containerHigh",
      borderRadius: "16px",
    }}
  >
    <Box
      sx={{
        display: "flex",
        flexShrink: 0,
        // Centres the 16px icon on the label's first line of body text.
        pt: "2px",
        "& svg": { fontSize: 16, color: "primary.main" },
      }}
    >
      {icon}
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" component="div" sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
      {note && (
        <Typography variant="caption" color="text.secondary" component="div">
          {note}
        </Typography>
      )}
    </Box>
  </Box>
);

// The reading on a short scale of the club's landmarks either side of it.
const RiverLevelLandmarks: React.FC<RiverLevelLandmarksProps> = ({
  riverLevel,
  readingNote,
  compact,
  readingLabel = "Current level",
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

  const reading: ScaleRow = onLandmark
    ? { ...onLandmark, isReading: true, onLandmark: true }
    : { level: riverLevel, desc: readingLabel, isReading: true };
  const size = compact ? COMPACT_SIZE : FULL_SIZE;

  const rows: ScaleRow[] = [
    ...above.map((l) => ({ ...l, isReading: false })),
    reading,
    ...below.map((l) => ({ ...l, isReading: false })),
  ];

  const readingIndex = rows.findIndex((r) => r.isReading);
  const segment = (filled: boolean) =>
    ({
      position: "absolute",
      width: `${size.track}px`,
      backgroundColor: filled ? "primary.main" : "divider",
    }) as const;

  return (
    <Box sx={{ mt: compact ? 0.5 : 1 }}>
      {rows.map((row, i) => (
        <Box
          key={`${row.level}-${i}`}
          sx={{
            display: "flex",
            alignItems: "flex-start",
            px: 1.5,
            ...(row.isReading && {
              backgroundColor: "surfaces.containerHigh",
              borderRadius: compact ? "12px" : "16px",
            }),
          }}
        >
          <Box
            sx={{
              width: size.levelWidth,
              flexShrink: 0,
              textAlign: "right",
              pr: compact ? 1 : 1.5,
              pt: `${size.rowPad + (size.text ? 0 : 1)}px`,
              pb: `${size.rowPad}px`,
              fontSize: size.levelFontSize,
              ...(size.text && { lineHeight: `${size.text.line}px` }),
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
                  height: `${size.dotCenter}px`,
                }}
              />
            ) : (
              // Rounded cap at the top of the track.
              <Box
                sx={{
                  ...segment(i > readingIndex),
                  top: `${size.dotCenter - size.track}px`,
                  height: `${size.track}px`,
                  borderRadius: `${size.track}px ${size.track}px 0 0`,
                }}
              />
            )}
            {/* The track stops at the bottom dot: below the lowest landmark
              shown there is nothing to measure against. */}
            {i < rows.length - 1 && (
              <Box
                sx={{
                  ...segment(i >= readingIndex),
                  top: `${size.dotCenter}px`,
                  bottom: 0,
                }}
              />
            )}
            <Box
              sx={{
                position: "absolute",
                top: `${size.dotCenter - (row.isReading ? size.readingDot : size.dot) / 2}px`,
                width: row.isReading ? size.readingDot : size.dot,
                height: row.isReading ? size.readingDot : size.dot,
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
                    ? `0 0 0 ${size.halo}px rgba(${(theme.vars ?? theme).palette.primary.mainChannel} / 0.2)`
                    : "none",
                zIndex: 1,
              }}
            />
          </Box>
          <Box sx={{ flex: 1, pl: compact ? 1 : 1.5, py: `${size.rowPad}px` }}>
            <Typography
              variant="body2"
              sx={{
                // Medium, like the card's section labels: enough to set the
                // reading apart from the landmarks without a style (italics)
                // nothing else on the page uses.
                fontWeight: row.isReading ? 500 : 400,
                ...(size.text && {
                  fontSize: size.text.desc,
                  lineHeight: `${size.text.line}px`,
                }),
                // "Current level" has no descenders (g/j/p/q/y), so its
                // glyphs sit visibly higher within the line box than text
                // that does - nudge down to read as centered against the
                // dot and level number, which don't have this effect.
                ...(row.isReading &&
                  !row.onLandmark &&
                  !size.text && { mt: "1px" }),
              }}
            >
              {/* Compact, a forecast hour's reading row is a single line: where
                  the level comes from says it's a forecast, without a
                  "Forecast level" line above it. */}
              {compact && row.isReading && !row.onLandmark && readingNote
                ? readingNote
                : row.desc}
            </Typography>
            {/* The secondary line under each row: a landmark's distance, or
                the reading's age or source - on a line of its own rather than
                bracketed onto the end of the text above it. */}
            {(() => {
              // Compact leaves out each landmark's distance - the level
              // column beside it already gives it - to keep a forecast hour
              // short enough to fit on a phone screen.
              const note = !row.isReading
                ? compact
                  ? null
                  : formatDistance(row.level - riverLevel)
                : row.onLandmark
                  ? [readingLabel, readingNote].filter(Boolean).join(" – ")
                  : compact
                    ? null
                    : readingNote;
              return note ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  component={size.text ? "div" : "span"}
                  sx={
                    size.text && { fontSize: size.text.note, lineHeight: 1.3 }
                  }
                >
                  {note}
                </Typography>
              ) : null;
            })()}
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
      // The reading row with its "Gauge read …" line beneath.
      height={64}
      animation="wave"
    />
    <LandmarkRowSkeleton />
  </Box>
);

export default RiverLevelLandmarks;

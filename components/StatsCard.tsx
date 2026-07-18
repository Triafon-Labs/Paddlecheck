"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import Thermostat from "@mui/icons-material/Thermostat";
import Visibility from "@mui/icons-material/Visibility";
import Air from "@mui/icons-material/Air";
import Water from "@mui/icons-material/Water";
import WaterDrop from "@mui/icons-material/WaterDrop";
import NightsStay from "@mui/icons-material/NightsStay";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import { KayakConditions } from "@/types";
import { degreesToCompass } from "@/lib/weather";
import { THRESHOLDS } from "@/lib/config";
import { ragStatus, LEVEL_DESCRIPTIONS } from "@/lib/rag";

interface StatsCardProps {
  conditions: KayakConditions | null;
  loading: boolean;
  reasons: string[];
}

interface ScaleRow {
  level: number;
  desc: string;
  current: boolean; // highlighted as the reading's position
  isReading: boolean; // this row IS the live reading, not a landmark
}

// Vertical center of the tick dot within its row (top: 7px + half of its
// 8px height). Line segments anchor here rather than at 50% of the row's
// height, since rows vary in height (multi-line descriptions) but the
// dot's own offset from the row top never changes.
const TICK_DOT_CENTER = 11;

// If the reading is within this many metres of the nearest landmark,
// merge it into that landmark's row instead of giving it its own row.
const NEAR_THRESHOLD_M = 0.1;

const StatItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tooltip?: string;
  isInfluencing?: boolean;
}> = ({ icon, label, value, tooltip, isInfluencing }) => (
  <Tooltip title={tooltip || label} placement="top">
    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
      <Box sx={{ mr: 1.5, color: "primary.main" }}>{icon}</Box>
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "flex", alignItems: "center" }}
        >
          {label}
          {isInfluencing && (
            <Box
              component="span"
              sx={{ display: "inline-flex", alignItems: "center", ml: 0.5 }}
            >
              🚦
              <ArrowUpward sx={{ fontSize: "inherit", color: "error.main" }} />
            </Box>
          )}
        </Typography>
        <Typography variant="body1" component="div">
          {value}
        </Typography>
      </Box>
    </Box>
  </Tooltip>
);

const RiverLevelSection: React.FC<{
  conditions: KayakConditions;
  isInfluencing: boolean;
}> = ({ conditions, isInfluencing }) => {
  const { riverLevel, overallStatus, levelChange } = conditions;
  if (riverLevel === undefined) return null;

  const levels = Object.entries(LEVEL_DESCRIPTIONS)
    .map(([level, desc]) => ({ level: parseFloat(level), desc }))
    .sort((a, b) => a.level - b.level);

  const below = levels
    .filter((l) => l.level <= riverLevel)
    .slice(-1)
    .reverse(); // nearest-below first, descending
  const above = levels
    .filter((l) => l.level > riverLevel)
    .slice(0, 1)
    .reverse(); // furthest-above first, descending

  const nearestAbove = above[above.length - 1] ?? null;
  const nearestBelow = below[0] ?? null;
  const aboveDist = nearestAbove ? nearestAbove.level - riverLevel : Infinity;
  const belowDist = nearestBelow ? riverLevel - nearestBelow.level : Infinity;
  const isNear = Math.min(aboveDist, belowDist) <= NEAR_THRESHOLD_M;

  const markerColor = overallStatus
    ? ragStatus[overallStatus].color
    : ragStatus.Unknown.color;

  let rows: ScaleRow[];
  if (isNear) {
    // Close enough to an existing landmark to just highlight that row
    // rather than adding a separate one for the live reading.
    const nearestLevel =
      aboveDist <= belowDist ? nearestAbove!.level : nearestBelow!.level;
    rows = [...above, ...below].map((l) => ({
      ...l,
      current: l.level === nearestLevel,
      isReading: false,
    }));
  } else {
    rows = [
      ...above.map((l) => ({ ...l, current: false, isReading: false })),
      { level: riverLevel, desc: "Current level", current: true, isReading: true },
      ...below.map((l) => ({ ...l, current: false, isReading: false })),
    ];
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Box sx={{ mr: 1.5, color: "primary.main" }}>
          <Water />
        </Box>
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "flex", alignItems: "center" }}
          >
            River Level
            {isInfluencing && (
              <Box
                component="span"
                sx={{ display: "inline-flex", alignItems: "center", ml: 0.5 }}
              >
                🚦
                <ArrowUpward sx={{ fontSize: "inherit", color: "error.main" }} />
              </Box>
            )}
          </Typography>
          {levelChange && (
            <Typography variant="body1" component="div">
              {levelChange.value > THRESHOLDS.RIVER_LEVEL_TREND_THRESHOLD
                ? "Rising"
                : levelChange.value < -THRESHOLDS.RIVER_LEVEL_TREND_THRESHOLD
                  ? "Falling"
                  : "Steady"}
            </Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ pl: "44px" }}>
        {rows.map((row, i) => (
          <Box
            key={`${row.level}-${i}`}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              py: 1,
              px: 1.5,
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
                fontWeight: row.current && !row.isReading ? 700 : 400,
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
                sx={{
                  position: "absolute",
                  top: `${TICK_DOT_CENTER - (row.current ? 6 : 4)}px`,
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
                sx={{
                  fontWeight: row.current && !row.isReading ? 700 : 400,
                  fontStyle: row.isReading ? "italic" : "normal",
                  // "Current level" has no descenders (g/j/p/q/y), so its
                  // glyphs sit visibly higher within the line box than text
                  // that does - nudge down to read as centered against the
                  // dot and level number, which don't have this effect.
                  ...(row.isReading && { mt: "1px" }),
                }}
              >
                {row.desc}
              </Typography>
              {row.current && !row.isReading && (
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
    </Box>
  );
};

const StatsCard: React.FC<StatsCardProps> = ({ conditions, loading, reasons }) => {
  if (loading) {
    return (
      <Card variant="outlined" sx={{ width: "100%", p: 2 }}>
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom>
            Detailed Stats
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!conditions) {
    return null;
  }

  return (
    <Card variant="outlined" sx={{ width: "100%", p: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Detailed Stats
        </Typography>
        <Box sx={{ mt: 1 }}>
          <RiverLevelSection
            conditions={conditions}
            isInfluencing={reasons.some((r) => r.includes("river level"))}
          />
          <StatItem
            icon={<Thermostat />}
            label="Temperature"
            value={`${conditions.temperature?.toFixed(1)}°C`}
            isInfluencing={reasons.some((r) => r.includes("temperature"))}
          />
          <StatItem
            icon={<Air />}
            label="Wind Speed"
            value={`${conditions.windSpeed?.toFixed(1)} mph${conditions.windDirection !== undefined ? ` ${degreesToCompass(conditions.windDirection)}` : ""}`}
            isInfluencing={reasons.includes("High winds")}
          />
          <StatItem
            icon={<Visibility />}
            label="Visibility"
            value={conditions.visibilityDescription}
            isInfluencing={reasons.includes("Foggy")}
          />
          {conditions.rain && (
            <StatItem
              icon={<WaterDrop />}
              label="Rain"
              value={conditions.weatherDescription || "Yes"}
              isInfluencing={reasons.includes("Rain")}
            />
          )}
          {conditions.dark && (
            <StatItem
              icon={<NightsStay />}
              label="Dark"
              value="Yes"
              isInfluencing={reasons.includes("Dark")}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard;

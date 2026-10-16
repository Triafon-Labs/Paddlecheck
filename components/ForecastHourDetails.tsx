"use client";

import React, { useRef } from "react";
import { Box, Chip, IconButton, Skeleton, Typography } from "@mui/material";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Air from "@mui/icons-material/Air";
import WaterDrop from "@mui/icons-material/WaterDrop";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import WbSunny from "@mui/icons-material/WbSunny";
import NightsStay from "@mui/icons-material/NightsStay";
import { ForecastGraphDataPoint, ForecastSource } from "@/types";
import { ragStatus, describeReason } from "@/lib/rag";
import { REASON_ICONS } from "@/lib/config";
import { formatRiverLevel, formatWindGust } from "@/lib/units";
import { hhmmOfISO, hourOfISO, minutesOfISO } from "@/lib/time";

const FORECAST_SOURCE_LABELS: Record<ForecastSource, string> = {
  bewdley: "Bewdley upstream forecast",
  linear: "Local trend (linear)",
  held: "No forecast – level held",
};

// A horizontal drag this far across the panel steps one hour. Anything
// shorter, or more vertical than horizontal, is left as a tap or a scroll.
const SWIPE_THRESHOLD_PX = 40;

// One row of small chips, so the panel keeps its height while scrubbing
// between an hour with no factors and one with a single row of them.
const CHIP_ROW_MIN_HEIGHT = 24;

// How far ahead of sunset the panel starts counting down to it - about a
// club session's length, so it's there when choosing when to start without
// turning up on most of the afternoon.
const SUNSET_COUNTDOWN_MINUTES = 3 * 60;

// 70 -> "1 h 10 min", 60 -> "1 h", 10 -> "10 min".
const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

// "9:00" -> "09:00", to match every other time the app shows.
const padHour = (time: string) => time.padStart(5, "0");

interface ForecastHourDetailsProps {
  point: ForecastGraphDataPoint | null;
  dayLabel: string;
  // The day's sunrise/sunset, to flag the hour each falls in.
  sunrise: string | null;
  sunset: string | null;
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}

// The always-visible read-out under the forecast chart, for the hour picked
// on it. It replaces a floating tooltip, which on a phone sat under the
// finger doing the picking and vanished as soon as the finger lifted.
const ForecastHourDetails: React.FC<ForecastHourDetailsProps> = ({
  point,
  dayLabel,
  sunrise,
  sunset,
  loading,
  onPrev,
  onNext,
  canPrev,
  canNext,
}) => {
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  if (loading || !point) {
    return (
      <Box sx={{ mt: 2 }}>
        <Skeleton variant="rounded" height={44} animation="wave" />
        <Skeleton variant="text" width="60%" animation="wave" sx={{ mt: 1 }} />
        <Skeleton variant="text" width="80%" animation="wave" />
      </Box>
    );
  }

  const statusConfig = ragStatus[point.status] ?? ragStatus.Unknown;
  // The hours the sun rises or sets in count as daylight in the status (see
  // isDarkHour), so the exact time is called out here instead and the
  // paddler can judge how much of the hour they'd have light for.
  // Sunset is also counted down over the hours leading up to it, measured
  // from the start of the picked hour, for planning when to get on the water.
  const hour = parseInt(point.time, 10);
  const sunsetMinutes = minutesOfISO(sunset);
  const minutesToSunset =
    sunsetMinutes !== null ? sunsetMinutes - hour * 60 : null;
  const sunEvent =
    sunrise && hourOfISO(sunrise) === hour
      ? { label: `Sunrise at ${hhmmOfISO(sunrise)}`, Icon: WbSunny }
      : sunset &&
          minutesToSunset !== null &&
          minutesToSunset > 0 &&
          minutesToSunset <= SUNSET_COUNTDOWN_MINUTES
        ? {
            label: `Sunset at ${hhmmOfISO(sunset)} (${formatDuration(minutesToSunset)} away)`,
            Icon: NightsStay,
          }
        : null;
  const timeLabel = `${dayLabel} ${padHour(point.time)}`;

  const handlePointerDown = (e: React.PointerEvent) => {
    swipeStart.current = { x: e.clientX, y: e.clientY };
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) {
      return;
    }
    // Swiping left brings the later hour in, as with any carousel.
    if (dx < 0 && canNext) onNext();
    if (dx > 0 && canPrev) onPrev();
  };

  return (
    <Box
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => (swipeStart.current = null)}
      // Vertical drags still scroll the page; horizontal ones are the swipe.
      sx={{ mt: 2, touchAction: "pan-y" }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          onClick={onPrev}
          disabled={!canPrev}
          aria-label="Previous hour"
          edge="start"
        >
          <ChevronLeft />
        </IconButton>
        <Box
          aria-live="polite"
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            flexWrap: "wrap",
            minWidth: 0,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {timeLabel}
          </Typography>
          <Chip
            label={point.status}
            size="small"
            sx={{
              "--chip-bg": statusConfig.color,
              "--chip-fg": statusConfig.onColor,
              fontWeight: 600,
            }}
          />
        </Box>
        <IconButton
          onClick={onNext}
          disabled={!canNext}
          aria-label="Next hour"
          edge="end"
        >
          <ChevronRight />
        </IconButton>
      </Box>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ textAlign: "center" }}
      >
        {point.forecastSource === "held" ? "Assumed" : "Forecast"} level{" "}
        {formatRiverLevel(point.forecastLevel)}
        <Typography
          component="span"
          variant="caption"
          color="text.disabled"
          sx={{ ml: 1 }}
        >
          {FORECAST_SOURCE_LABELS[point.forecastSource]}
        </Typography>
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 0.75,
          mt: 1,
          minHeight: CHIP_ROW_MIN_HEIGHT,
        }}
      >
        {point.reasons.map((reason) => {
          const Icon = REASON_ICONS[reason];
          return (
            <Chip
              key={reason}
              size="small"
              icon={Icon ? <Icon fontSize="small" /> : undefined}
              label={describeReason(reason, {
                temperature: point.temperature,
                windSpeed: point.windSpeed,
              })}
            />
          );
        })}
        {/* "Be aware" items aren't part of the status, so they're outlined
            to read as a side note rather than another contributing factor. */}
        {point.gustStatus && (
          <Chip
            size="small"
            variant="outlined"
            icon={<Air fontSize="small" />}
            label={
              <Box
                component="span"
                sx={{ display: "flex", alignItems: "center" }}
              >
                Gusts up to {formatWindGust(point.windGust!)}
                <FiberManualRecord
                  titleAccess={`Would be ${point.gustStatus} if sustained`}
                  sx={{
                    fontSize: 8,
                    color: ragStatus[point.gustStatus].color,
                    ml: 0.75,
                  }}
                />
              </Box>
            }
          />
        )}
        {point.rainWhileWarm && (
          <Chip
            size="small"
            variant="outlined"
            icon={<WaterDrop fontSize="small" />}
            label={point.weatherDescription || "Rain"}
          />
        )}
        {sunEvent && (
          <Chip
            size="small"
            variant="outlined"
            icon={<sunEvent.Icon fontSize="small" />}
            label={sunEvent.label}
          />
        )}
        {point.reasons.length === 0 &&
          !point.gustStatus &&
          !point.rainWhileWarm &&
          !sunEvent && (
            <Typography variant="caption" color="text.secondary">
              No contributing factors
            </Typography>
          )}
      </Box>
    </Box>
  );
};

export default ForecastHourDetails;

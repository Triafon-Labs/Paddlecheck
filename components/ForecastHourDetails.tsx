"use client";

import React, { useRef } from "react";
import { Box, Chip, IconButton, Skeleton, Typography } from "@mui/material";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import NightsStay from "@mui/icons-material/NightsStay";
import { ForecastGraphDataPoint, ForecastSource } from "@/types";
import { ragStatus } from "@/lib/rag";
import { formatRiverLevel } from "@/lib/units";
import { hhmmOfISO, minutesOfISO } from "@/lib/time";
import {
  ContributingFactors,
  BeAware,
  BeAwareItem,
  beAwareItemsFor,
} from "./ConditionFactors";

const FORECAST_SOURCE_LABELS: Record<ForecastSource, string> = {
  bewdley: "Bewdley upstream forecast",
  linear: "Local trend (linear)",
  held: "No forecast – level held",
};

// A horizontal drag this far across the panel steps one hour. Anything
// shorter, or more vertical than horizontal, is left as a tap or a scroll.
const SWIPE_THRESHOLD_PX = 40;

// How far ahead of sunset the panel starts counting down to it - about a
// club session's length, so it's there when choosing when to start without
// turning up on most of the afternoon.
const SUNSET_COUNTDOWN_MINUTES = 2 * 60;

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
  // Every shown hour across the forecast, each with its own day's sunset,
  // which together set the panel's height.
  hours: { point: ForecastGraphDataPoint; sunset: string | null }[];
  dayLabel: string;
  // The day's sunset, counted down to over the hours before it.
  sunset: string | null;
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}

// Sunset is counted down over the hours leading up to it, measured from the
// start of the hour, for planning when to get off the water. Sunrise gets
// nothing: by the first light hour it only gets lighter.
const sunsetItemFor = (
  point: ForecastGraphDataPoint,
  sunset: string | null
): BeAwareItem | null => {
  const sunsetMinutes = minutesOfISO(sunset);
  if (!sunset || sunsetMinutes === null) return null;
  const minutesToSunset = sunsetMinutes - parseInt(point.time, 10) * 60;
  if (minutesToSunset <= 0 || minutesToSunset > SUNSET_COUNTDOWN_MINUTES) {
    return null;
  }
  return {
    key: "sunset",
    Icon: NightsStay,
    text: `Sunset at ${hhmmOfISO(sunset)} (${formatDuration(minutesToSunset)} away)`,
  };
};

// Everything under the hour's header: its river level and factor sections.
const HourBody: React.FC<{
  point: ForecastGraphDataPoint;
  sunset: string | null;
}> = ({ point, sunset }) => {
  const sunsetItem = sunsetItemFor(point, sunset);
  const beAwareItems = [
    ...beAwareItemsFor(point),
    ...(sunsetItem ? [sunsetItem] : []),
  ];
  return (
    <>
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
      {point.reasons.length > 0 && (
        <ContributingFactors
          reasons={point.reasons}
          temperature={point.temperature}
          windSpeed={point.windSpeed}
        />
      )}
      {beAwareItems.length > 0 && <BeAware items={beAwareItems} />}
    </>
  );
};

// The always-visible read-out under the forecast chart, for the hour picked
// on it. It replaces a floating tooltip, which on a phone sat under the
// finger doing the picking and vanished as soon as the finger lifted.
const ForecastHourDetails: React.FC<ForecastHourDetailsProps> = ({
  point,
  hours,
  dayLabel,
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
  const timeLabel = `${dayLabel} ${padHour(point.time)}`;

  const handlePointerDown = (e: React.PointerEvent) => {
    // A drag that starts on the hour buttons isn't a swipe: the button's own
    // click would fire as well and step a second hour.
    if ((e.target as HTMLElement).closest("button")) {
      swipeStart.current = null;
      return;
    }
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

      {/* Every shown hour of the forecast is laid out in the same grid cell,
          with only the picked one visible, so the panel is always as tall
          as the busiest hour and never changes height - shifting the page
          under the reader's thumb - as they step through hours or days.
          Picked by identity: the same "H:00" recurs on every day. */}
      <Box sx={{ display: "grid" }}>
        {(hours.some((h) => h.point === point)
          ? hours
          : [{ point, sunset }]
        ).map((h, index) => {
          const picked = h.point === point;
          return (
            <Box
              key={index}
              aria-hidden={!picked}
              sx={{
                gridArea: "1 / 1",
                visibility: picked ? "visible" : "hidden",
              }}
            >
              <HourBody point={h.point} sunset={h.sunset} />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ForecastHourDetails;

"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Skeleton,
  Typography,
} from "@mui/material";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import NightsStay from "@mui/icons-material/NightsStay";
import { ForecastGraphDataPoint, ForecastSource } from "@/types";
import { ragStatus } from "@/lib/rag";
import { formatRiverLevel } from "@/lib/units";
import { hhmmOfISO, minutesOfISO } from "@/lib/time";
import { m3Duration, m3Easing } from "@/lib/m3-palette";
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

interface StepProps {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}

// A horizontal swipe across the header or the details steps one hour.
const useSwipeStep = ({ onPrev, onNext, canPrev, canNext }: StepProps) => {
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: React.PointerEvent) => {
      // A drag that starts on the hour buttons isn't a swipe: the button's
      // own click would fire as well and step a second hour.
      if ((e.target as HTMLElement).closest("button")) {
        swipeStart.current = null;
        return;
      }
      swipeStart.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: React.PointerEvent) => {
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
    },
    onPointerCancel: () => {
      swipeStart.current = null;
    },
  };
};

// Vertical drags still scroll the page; horizontal ones are the swipe.
const swipeSx = { touchAction: "pan-y" } as const;

interface ForecastHourHeaderProps extends StepProps {
  point: ForecastGraphDataPoint | null;
  dayLabel: string;
  loading?: boolean;
}

// The picked hour's "‹ Sat 14:00 [status] ›" row, under the forecast chart.
// The hour's details follow in ForecastHourBodies. Together they replace a
// floating tooltip, which on a phone sat under the finger doing the picking
// and vanished as soon as the finger lifted.
export const ForecastHourHeader: React.FC<ForecastHourHeaderProps> = ({
  point,
  dayLabel,
  loading,
  ...step
}) => {
  const swipe = useSwipeStep(step);

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

  return (
    <Box
      {...swipe}
      sx={{
        ...swipeSx,
        mt: 2,
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      <IconButton
        onClick={step.onPrev}
        disabled={!step.canPrev}
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
        onClick={step.onNext}
        disabled={!step.canNext}
        aria-label="Next hour"
        edge="end"
      >
        <ChevronRight />
      </IconButton>
    </Box>
  );
};

interface ForecastHourBodiesProps extends StepProps {
  point: ForecastGraphDataPoint;
  // Every shown hour across the forecast, each with its own day's sunset.
  hours: { point: ForecastGraphDataPoint; sunset: string | null }[];
  // The picked hour's own day's sunset, for when it isn't among `hours`.
  sunset: string | null;
}

// The picked hour's details, as a card that continues the forecast card above
// it - flush, same surface, square top corners - so the two read as one.
//
// Every shown hour of the forecast is also laid out, invisibly, in the same
// grid cell. The cell is therefore always as tall as the busiest hour, so the
// page never changes height - shifting the chart and the step buttons under
// the reader's thumb - as they step through hours or days, and the space the
// quieter hours leave shows as page background below the card.
//
// The visible card sits on top, sized to the picked hour's invisible copy and
// easing to each new hour's height. It clips its content while it does, so a
// taller hour's text never spills out past a card still growing to fit it.
// Copies are picked by identity: the same "H:00" recurs on every day.
export const ForecastHourBodies: React.FC<ForecastHourBodiesProps> = ({
  point,
  hours,
  sunset,
  ...step
}) => {
  const swipe = useSwipeStep(step);
  const rows = hours.some((h) => h.point === point)
    ? hours
    : [{ point, sunset }];
  const pickedIndex = rows.findIndex((h) => h.point === point);
  const picked = rows[pickedIndex];

  const copyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [height, setHeight] = useState<number | null>(null);

  // Follows the picked copy's height, including when it reflows (a rotated
  // phone, a refetch). The first measurement lands on a card already at its
  // natural height, so nothing animates on load.
  useEffect(() => {
    const copy = copyRefs.current[pickedIndex];
    if (!copy) return;
    const observer = new ResizeObserver(() => setHeight(copy.offsetHeight));
    observer.observe(copy);
    return () => observer.disconnect();
  }, [pickedIndex, rows.length]);

  return (
    <Box
      {...swipe}
      // Overlaps the card above by a pixel so no seam shows between them at
      // fractional device pixel ratios.
      sx={{ ...swipeSx, display: "grid", mt: "-1px" }}
    >
      {rows.map((h, index) => (
        <Box
          key={index}
          ref={(el: HTMLDivElement | null) => {
            copyRefs.current[index] = el;
          }}
          aria-hidden
          sx={{ gridArea: "1 / 1", alignSelf: "start", visibility: "hidden" }}
        >
          <CardContent sx={{ pt: 0 }}>
            <HourBody point={h.point} sunset={h.sunset} />
          </CardContent>
        </Box>
      ))}
      <Card
        sx={{
          gridArea: "1 / 1",
          alignSelf: "start",
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          height: height ?? "auto",
          transition: `height ${m3Duration.medium1}ms ${m3Easing.standard}`,
        }}
      >
        <CardContent sx={{ pt: 0 }}>
          <HourBody point={picked.point} sunset={picked.sunset} />
        </CardContent>
      </Card>
    </Box>
  );
};

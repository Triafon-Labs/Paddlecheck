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
import Water from "@mui/icons-material/Water";
import { ForecastGraphDataPoint, ForecastSource } from "@/types";
import { ragStatus } from "@/lib/rag";
import { formatRiverLevel } from "@/lib/units";
import { m3Duration, m3Easing } from "@/lib/m3-palette";
import {
  FactorHeading,
  FactorChip,
  FactorChipRow,
  factorSizes,
  ContributingFactors,
  BeAware,
  beAwareItemsFor,
  sunsetItemFor,
} from "./ConditionFactors";

// Where the hour's level comes from, shown in brackets after "River Level".
const FORECAST_SOURCE_LABELS: Record<ForecastSource, string> = {
  bewdley: "upstream forecast",
  linear: "local trend",
  held: "held – no forecast",
};

// A horizontal drag this far across the panel steps one hour. Anything
// shorter, or more vertical than horizontal, is left as a tap or a scroll.
const SWIPE_THRESHOLD_PX = 40;

// "9:00" -> "09:00", to match every other time the app shows.
const padHour = (time: string) => time.padStart(5, "0");

// The forecast's details sit a size below the current status's.
const compactSize = factorSizes(true);

// Everything under the hour's header: its river level and factor sections.
const HourBody: React.FC<{
  point: ForecastGraphDataPoint;
  sunset: string | null;
}> = ({ point, sunset }) => {
  // Measured from the start of the hour.
  const sunsetItem = sunsetItemFor(parseInt(point.time, 10) * 60, sunset);
  const beAwareItems = [
    ...beAwareItemsFor(point),
    ...(sunsetItem ? [sunsetItem] : []),
  ];
  return (
    <>
      {/* Laid out like the factor sections below it - heading, then an
          InfoPanel - with where the level comes from trailing on the right. */}
      <Box sx={compactSize.sectionSx}>
        <FactorHeading compact>
          River Level ({FORECAST_SOURCE_LABELS[point.forecastSource]})
        </FactorHeading>
        <FactorChipRow>
          <FactorChip
            Icon={Water}
            label={formatRiverLevel(point.forecastLevel)}
          />
        </FactorChipRow>
      </Box>
      {point.reasons.length > 0 && (
        <ContributingFactors
          reasons={point.reasons}
          temperature={point.temperature}
          windSpeed={point.windSpeed}
          compact
        />
      )}
      {beAwareItems.length > 0 && <BeAware items={beAwareItems} compact />}
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
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
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

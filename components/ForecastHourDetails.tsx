"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  Skeleton,
  Typography,
} from "@mui/material";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Water from "@mui/icons-material/Water";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { ForecastGraphDataPoint, ForecastSource, PaddlerType } from "@/types";
import { ragStatus } from "@/lib/rag";
import { getPaddlingMatrix, hasDetailsToShow } from "@/lib/paddlingMatrix";
import { usePaddlerLevel } from "@/lib/usePaddlerLevel";
import { formatRiverLevel } from "@/lib/units";
import {
  collapseMotion,
  m3Duration,
  m3Easing,
  m3Spring,
  spring,
} from "@/lib/m3-palette";
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
import { StatusFace, PADDLING_STATUS_UI } from "./StatusFace";

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

// The reader's level, and whether their verdict's details are open. Open
// state is shared by every hour, so stepping through the day with it open
// shows how the caveats change.
interface YouProps {
  level: PaddlerType;
  open: boolean;
  onToggle: () => void;
  // Called once the list has finished opening or closing; only the visible
  // card's copy passes it.
  onSettled?: () => void;
}

// What the hour's status means for the reader's own level, from the same
// rules as Who Can Paddle. The RAG chip in the header is the club's rating;
// this answers "can I go?" without scrolling back up to the table. Tapping
// the chip lists the rules behind it, for when "with caveats" isn't enough
// to remember what the caveats are.
const YourVerdict: React.FC<{
  point: ForecastGraphDataPoint;
  you: YouProps;
}> = ({ point, you }) => {
  const verdict = getPaddlingMatrix(point.status, point.forecastLevel)[
    you.level
  ];
  if (!verdict) return null;
  const ui = PADDLING_STATUS_UI[verdict.status];
  const expandable = hasDetailsToShow(verdict.details);
  const open = expandable && you.open;
  return (
    <Box sx={compactSize.sectionSx}>
      <FactorHeading compact>You – {you.level}</FactorHeading>
      <FactorChipRow>
        <Chip
          size="small"
          icon={
            <StatusFace
              face={ui.face}
              color={ui.color}
              onColor={ui.onColor}
              size={16}
            />
          }
          // The full sentence, as Who Can Paddle says it, with a chevron
          // when there's more to show - without it this reads as one of
          // the static chips below.
          label={
            <Box
              component="span"
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.25 }}
            >
              {ui.headline}
              {expandable && (
                <ExpandMore
                  aria-hidden
                  sx={{
                    fontSize: 18,
                    mr: -0.5,
                    transform: open ? "rotate(180deg)" : "none",
                    transition: spring("transform", m3Spring.spatialFast),
                  }}
                />
              )}
            </Box>
          }
          {...(expandable && {
            onClick: you.onToggle,
            "aria-expanded": open,
          })}
          // The same text colour as the factor chips below it.
          sx={(theme) => ({
            "--chip-fg": (theme.vars ?? theme).palette.text.primary,
          })}
        />
      </FactorChipRow>
      <Collapse
        in={open}
        unmountOnExit
        {...collapseMotion}
        onEntered={you.onSettled}
        onExited={you.onSettled}
      >
        <Box
          component="ul"
          sx={{
            m: 0,
            mt: 0.75,
            pl: 2.5,
            "& li:not(:last-of-type)": { mb: 0.5 },
          }}
        >
          {verdict.details.map((line) => (
            <Typography key={line} component="li" variant="body2">
              {line}
            </Typography>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

// Everything under the hour's header: the verdict for the reader's level,
// then its river level and factor sections.
const HourBody: React.FC<{
  point: ForecastGraphDataPoint;
  sunset: string | null;
  you: YouProps | null;
}> = ({ point, sunset, you }) => {
  // Measured from the start of the hour.
  const sunsetItem = sunsetItemFor(parseInt(point.time, 10) * 60, sunset);
  const beAwareItems = [
    ...beAwareItemsFor(point),
    ...(sunsetItem ? [sunsetItem] : []),
  ];
  return (
    <>
      {you && <YourVerdict point={point} you={you} />}
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
  // Read once here rather than in every hour's copy below.
  const level = usePaddlerLevel() ?? null;
  const [verdictOpen, setVerdictOpen] = useState(false);
  // While the verdict's list opens or closes, the card sizes to its own
  // content, so it grows and shrinks with the list's collapse rather than
  // chasing the measured height a frame behind with a transition of its own.
  // It goes back to the measured height once the collapse has finished.
  const [followContent, setFollowContent] = useState(false);
  const toggleVerdict = () => {
    setVerdictOpen((o) => !o);
    setFollowContent(true);
  };
  // Every hour's copy gets the same open state, so the cell is sized for the
  // busiest hour as it would be shown - stepping with the details open
  // doesn't move anything either.
  const you: YouProps | null = level
    ? {
        level,
        open: verdictOpen,
        onToggle: toggleVerdict,
      }
    : null;
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
            <HourBody point={h.point} sunset={h.sunset} you={you} />
          </CardContent>
        </Box>
      ))}
      <Card
        sx={{
          gridArea: "1 / 1",
          alignSelf: "start",
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          height: followContent ? "auto" : (height ?? "auto"),
          transition: followContent
            ? "none"
            : `height ${m3Duration.medium1}ms ${m3Easing.standard}`,
        }}
      >
        <CardContent sx={{ pt: 0 }}>
          <HourBody
            point={picked.point}
            sunset={picked.sunset}
            you={you && { ...you, onSettled: () => setFollowContent(false) }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

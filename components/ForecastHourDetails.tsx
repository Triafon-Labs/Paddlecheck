"use client";

import React, {
  memo,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { ForecastGraphDataPoint, ForecastSource, PaddlerType } from "@/types";
import { ragStatus } from "@/lib/rag";
import { getPaddlingMatrix } from "@/lib/paddlingMatrix";
import { usePaddlerLevel } from "@/lib/usePaddlerLevel";
import { m3Duration, m3Easing } from "@/lib/m3-palette";
import {
  FactorHeading,
  factorSizes,
  ContributingFactors,
} from "./ConditionFactors";
import PaddlerLevelRow from "./PaddlerLevelRow";
import Thermostat from "@mui/icons-material/Thermostat";
import RiverLevelLandmarks, { CompactReadingRow } from "./RiverLevelLandmarks";
import { formatTemperature, formatWindSpeed } from "@/lib/units";

// Where the hour's level comes from, under its row on the scale.
const FORECAST_SOURCE_LABELS: Record<ForecastSource, string> = {
  bewdley: "From the upstream forecast",
  linear: "From the local trend",
  held: "Held – no forecast this far ahead",
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
  // Set only on the visible card: it animates the list and calls this once
  // the list has finished opening or closing. The invisible copies just show
  // or hide it - animating every hour's copy at once relaid out dozens of
  // them each frame, which made the visible collapse stutter.
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
}> = ({ point, you }) => (
  <Box sx={compactSize.sectionSx}>
    <FactorHeading compact>You</FactorHeading>
    {/* Who Can Paddle's own row for the reader's level, so the forecast's
        verdict looks and opens the same way as the current one. */}
    <Box sx={{ mt: compactSize.listMt }}>
      <PaddlerLevelRow
        paddler={you.level}
        statusInfo={
          getPaddlingMatrix(point.status, point.forecastLevel)[you.level]
        }
        open={you.open}
        onToggle={you.onToggle}
        animate={!!you.onSettled}
        onSettled={you.onSettled}
        compact
      />
    </Box>
  </Box>
);

// Everything under the hour's header: the verdict for the reader's level,
// then its river level and factor sections.
const HourBody: React.FC<{
  point: ForecastGraphDataPoint;
  you: YouProps | null;
}> = ({ point, you }) => {
  return (
    <>
      {you && <YourVerdict point={point} you={you} />}
      {/* The status card's reading row, a size down, with where the level
          comes from beneath it. */}
      <Box sx={compactSize.sectionSx}>
        <FactorHeading compact>River Level</FactorHeading>
        <RiverLevelLandmarks
          riverLevel={point.forecastLevel}
          readingNote={FORECAST_SOURCE_LABELS[point.forecastSource]}
          compact
        />
      </Box>
      {/* Every hour's weather, in the same row as the river level - not only
          the hours where it counts against the status. */}
      {point.temperature !== undefined && (
        <Box sx={compactSize.sectionSx}>
          <FactorHeading compact>Weather</FactorHeading>
          <CompactReadingRow
            icon={<Thermostat />}
            label={[
              formatTemperature(point.temperature),
              point.weatherDescription,
            ]
              .filter(Boolean)
              .join(" · ")}
            note={
              point.windSpeed !== undefined
                ? `Wind ${formatWindSpeed(point.windSpeed)}${
                    point.windGust !== undefined
                      ? `, gusts ${formatWindSpeed(point.windGust)}`
                      : ""
                  }`
                : null
            }
          />
        </Box>
      )}
      {point.reasons.length > 0 && (
        <ContributingFactors
          reasons={point.reasons}
          temperature={point.temperature}
          windSpeed={point.windSpeed}
          compact
        />
      )}
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

type HourRow = { point: ForecastGraphDataPoint };
const NO_ROWS: HourRow[] = [];

// The invisible copy of every shown hour, stacked in one grid cell so the
// layer is as tall as the busiest hour. Memoised, so the visible card's own
// updates - each step of a collapse included - don't re-render dozens of
// copies.
//
// The layer is absolutely placed and layout-contained, outside the visible
// card's flow. It used to share a grid cell with the card, so any change to
// the card - every frame of its height easing between hours - made the
// browser lay out all ~50 copies again, ~1,500 boxes, which stalled stepping
// hours and switching days for hundreds of milliseconds on a phone.
const HourCopies = memo(function HourCopies({
  rows,
  you,
  copyRefs,
  layerRef,
}: {
  rows: HourRow[];
  you: YouProps | null;
  copyRefs: React.RefObject<(HTMLDivElement | null)[]>;
  layerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <Box
      ref={layerRef}
      aria-hidden
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        display: "grid",
        visibility: "hidden",
        pointerEvents: "none",
        contain: "layout style",
      }}
    >
      {rows.map((h, index) => (
        <Box
          key={index}
          ref={(el: HTMLDivElement | null) => {
            copyRefs.current[index] = el;
          }}
          sx={{ gridArea: "1 / 1", alignSelf: "start" }}
        >
          <CardContent sx={{ pt: 0 }}>
            <HourBody point={h.point} you={you} />
          </CardContent>
        </Box>
      ))}
    </Box>
  );
});

interface ForecastHourBodiesProps extends StepProps {
  point: ForecastGraphDataPoint;
  // Every shown hour across the forecast.
  hours: HourRow[];
}

// The picked hour's details, as a card that continues the forecast card above
// it - flush, same surface, square top corners - so the two read as one.
//
// Every shown hour of the forecast is also laid out, invisibly, in a layer
// behind the card (HourCopies). The panel reserves that layer's height - the
// busiest hour's - so the page never changes height - shifting the chart and
// the step buttons under the reader's thumb - as they step through hours or
// days, and the space the quieter hours leave shows as page background below
// the card.
//
// The visible card sits on top, sized to the picked hour's invisible copy and
// easing to each new hour's height. It clips its content while it does, so a
// taller hour's text never spills out past a card still growing to fit it.
// Copies are picked by identity: the same "H:00" recurs on every day.
export const ForecastHourBodies: React.FC<ForecastHourBodiesProps> = ({
  point,
  hours,
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
  const you: YouProps | null = level
    ? {
        level,
        open: verdictOpen,
        onToggle: toggleVerdict,
        onSettled: () => setFollowContent(false),
      }
    : null;
  // Every hour's copy gets the same open state, so the cell is sized for the
  // busiest hour as it would be shown - stepping with the details open
  // doesn't move anything either. Deferred, so re-rendering every copy never
  // holds up the visible card's first frame; until they catch up the card
  // sizes to its own content anyway.
  const copiesOpen = useDeferredValue(verdictOpen);
  const copyYou = useMemo<YouProps | null>(
    () =>
      level ? { level, open: copiesOpen, onToggle: () => undefined } : null,
    [level, copiesOpen]
  );
  const rows = useMemo(
    () => (hours.some((h) => h.point === point) ? hours : [{ point }]),
    [hours, point]
  );
  const pickedIndex = rows.findIndex((h) => h.point === point);
  const picked = rows[pickedIndex];
  // The copies are built at low priority, starting from none, so mounting
  // the panel - dozens of hours at once, ~400 ms on a phone - never holds up
  // its first frame. Until they arrive the card sizes to its own content and
  // the reserved height catches up a moment later.
  const copyRows = useDeferredValue(rows, NO_ROWS);
  const copyPickedIndex = copyRows.findIndex((h) => h.point === point);

  const copyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  // The copies' layer is out of flow, so the space it reserved by being in
  // the grid is now a min-height: the busiest hour's, so the page never
  // changes height - shifting the chart and step buttons - between hours.
  const [reserved, setReserved] = useState<number | null>(null);
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const observer = new ResizeObserver(() => setReserved(layer.offsetHeight));
    observer.observe(layer);
    return () => observer.disconnect();
  }, []);

  // Follows the picked copy's height, including when it reflows (a rotated
  // phone, a refetch). The first measurement lands on a card already at its
  // natural height, so nothing animates on load.
  useEffect(() => {
    const copy = copyRefs.current[copyPickedIndex];
    if (!copy) return;
    const observer = new ResizeObserver(() => setHeight(copy.offsetHeight));
    observer.observe(copy);
    return () => observer.disconnect();
  }, [copyPickedIndex, copyRows]);

  return (
    <Box
      {...swipe}
      // Overlaps the card above by a pixel so no seam shows between them at
      // fractional device pixel ratios.
      sx={{
        ...swipeSx,
        position: "relative",
        mt: "-1px",
        minHeight: reserved ?? undefined,
      }}
    >
      <HourCopies
        rows={copyRows}
        you={copyYou}
        copyRefs={copyRefs}
        layerRef={layerRef}
      />
      <Card
        sx={{
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          // Its own content's height until its copy exists to measure.
          height:
            followContent || copyPickedIndex === -1
              ? "auto"
              : (height ?? "auto"),
          transition: followContent
            ? "none"
            : `height ${m3Duration.medium1}ms ${m3Easing.standard}`,
        }}
      >
        <CardContent sx={{ pt: 0 }}>
          <HourBody point={picked.point} you={you} />
        </CardContent>
      </Card>
    </Box>
  );
};

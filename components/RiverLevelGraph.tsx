"use client";

import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  History,
  CalendarToday,
  Update,
} from "@mui/icons-material";
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useDeferredValue,
} from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  useTheme,
  Paper,
  ToggleButton,
  Divider,
  Grow,
} from "@mui/material";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  TooltipContentProps,
} from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import { ChartDataPoint } from "@/types";
import { formatDataAge } from "@/lib/time";
import { useNowTicking } from "@/lib/useNowTicking";
import { FORECAST_LINE_DASH, TIME_PERIODS } from "@/lib/config";
import { formatRiverLevel } from "@/lib/units";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { springTransition } from "@/lib/m3-palette";
import { useTooltipDismiss } from "@/lib/useTooltipDismiss";
import { revealSx } from "@/lib/chartMotion";

// The level's area and the forecast line draw in left to right, in CSS
// rather than through recharts (lib/chartMotion.ts) - recharts' default
// duration and easing, which this used before.
const chartRevealSx = revealSx(".recharts-area, .recharts-line", 1500, "ease");
import SlidingToggleButtonGroup from "./SlidingToggleButtonGroup";
import { TileHeading, TileValue, tileSx } from "./StatTile";

interface RiverLevelGraphProps {
  data: ChartDataPoint[] | null;
  forecastData: ChartDataPoint[] | null;
  loading: boolean;
  change1h: number | null;
  change24h: number | null;
  change8h: number | null;
  change5d: number | null;
}

const ChangeIndicator: React.FC<{
  period: string;
  change: number | null;
  icon: React.ReactNode;
  loading?: boolean;
}> = ({ period, change, icon, loading }) => {
  // Round first so the displayed value and the arrow direction always agree,
  // and so a value that rounds to zero (e.g. -0.001) never renders as "-0.00".
  const rounded = change !== null ? Number(change.toFixed(2)) : null;
  const changeStr =
    rounded !== null ? formatRiverLevel(Math.abs(rounded)) : null;
  const isFlat = rounded !== null && rounded === 0;

  return (
    <Paper elevation={0} sx={{ ...tileSx, height: "100%" }}>
      <TileHeading icon={icon} label={period} />
      <TileValue>
        {loading ? (
          <Skeleton variant="text" width={70} animation="wave" />
        ) : (
          <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
            {rounded !== null ? (
              isFlat ? (
                <TrendingFlat
                  fontSize="small"
                  sx={{ color: "text.secondary", mr: 0.5 }}
                />
              ) : rounded > 0 ? (
                <TrendingUp
                  fontSize="small"
                  sx={{ color: "error.main", mr: 0.5 }}
                />
              ) : (
                <TrendingDown
                  fontSize="small"
                  sx={{ color: "success.main", mr: 0.5 }}
                />
              )
            ) : null}
            {changeStr !== null ? changeStr : "N/A"}
          </Box>
        )}
      </TileValue>
    </Paper>
  );
};

// Axis labels are pinned to en-GB rather than the viewer's locale: this is a
// UK club app that shows 24-hour times everywhere else (the tooltip below,
// the forecast graph, lib/time.ts), and an empty locale would render "04:00
// PM" and "Aug 12" for anyone whose browser is set to a 12-hour locale.
const formatAxisTime = (date: Date) =>
  date.toLocaleTimeString("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

const formatAxisDate = (date: Date) =>
  date.toLocaleDateString("en-GB", { month: "short", day: "numeric" });

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipContentProps<ValueType, NameType>) => {
  if (active && payload && payload.length && label != null) {
    // The forecast view charts two series ("actual" and "forecasted") where
    // one is always null, so take the first entry that actually has a value.
    const value = payload.find((p) => typeof p.value === "number")?.value as
      number | undefined;
    if (value === undefined) return null;
    // label is either an ISO string (historical views) or a numeric timestamp (forecast view)
    const date = new Date(typeof label === "number" ? label : label);
    const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}, ${date
      .getHours()
      .toString()
      .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    return (
      <Paper sx={{ p: 2, pointerEvents: "none" }}>
        <Typography variant="body1">{formattedDate}</Typography>
        <Typography variant="body2">{formatRiverLevel(value)}</Typography>
      </Paper>
    );
  }

  return null;
};

const RiverLevelGraph: React.FC<RiverLevelGraphProps> = ({
  data,
  forecastData,
  loading,
  change1h,
  change24h,
  change8h,
  change5d,
}) => {
  const theme = useTheme();
  const chartRef = useRef<HTMLDivElement>(null);
  const { tooltipActive, chartMoveProps } = useTooltipDismiss(chartRef);
  const [selectedRange, setSelectedRange] = useState(
    () =>
      (typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEYS.RIVER_GRAPH_TIME_RANGE)
        : null) ?? "24h"
  );
  // The toggle follows a tap at once; the graph follows at low priority, so
  // building the new range's chart (~200 ms for 5 days on a phone-speed CPU)
  // happens behind the pill's slide rather than before it.
  const timeRange = useDeferredValue(selectedRange);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RIVER_GRAPH_TIME_RANGE, selectedRange);
  }, [selectedRange]);

  const now = useNowTicking();

  const dataAgeLabel = useMemo(() => {
    if (!data || data.length === 0) return null;
    return formatDataAge(
      new Date(data[data.length - 1].dateTime).getTime(),
      now
    );
  }, [data, now]);

  const filteredData = useMemo(() => {
    if (!data || data.length === 0 || timeRange === "forecast") return null;

    let hoursToFilter;
    if (timeRange === "1h") {
      hoursToFilter = 1;
    } else if (timeRange === "8h") {
      hoursToFilter = 8;
    } else if (timeRange === "24h") {
      hoursToFilter = 24;
    } else {
      return data;
    }

    // Anchor the window to the latest reading rather than wall-clock "now" so
    // the graph always shows a full window even when the data feed is lagging.
    const latest = new Date(data[data.length - 1].dateTime).getTime();
    const filterDate = new Date(latest - hoursToFilter * TIME_PERIODS.ONE_HOUR);

    return data.filter((d) => new Date(d.dateTime) > filterDate);
  }, [data, timeRange]);

  // Map filteredData to numeric timestamps so the XAxis can use type="number"
  const filteredDataWithTs = useMemo(
    () =>
      filteredData?.map((d) => ({
        ts: new Date(d.dateTime).getTime(),
        level: d.level,
      })) ?? null,
    [filteredData]
  );

  const yDomainMax = useMemo(() => {
    if (!filteredDataWithTs || filteredDataWithTs.length === 0) return 6;
    const maxLevel = Math.max(...filteredDataWithTs.map((d) => d.level));
    const roundedMax = Math.ceil(maxLevel);
    return roundedMax > 0 ? roundedMax : 6;
  }, [filteredDataWithTs]);

  // Generate evenly-spaced numeric ticks for a dataset given an interval in ms
  const makeTicks = (pts: { ts: number }[], intervalMs: number): number[] => {
    if (!pts.length) return [];
    const start = pts[0].ts;
    const end = pts[pts.length - 1].ts;
    const ticks: number[] = [];
    const cursor = new Date(start);
    if (intervalMs >= TIME_PERIODS.ONE_HOUR) {
      const intervalHours = intervalMs / TIME_PERIODS.ONE_HOUR;
      cursor.setMinutes(0, 0, 0);
      cursor.setHours(
        Math.ceil(cursor.getHours() / intervalHours) * intervalHours
      );
    } else {
      const intervalMins = intervalMs / (60 * 1000);
      cursor.setSeconds(0, 0);
      cursor.setMinutes(
        Math.ceil(cursor.getMinutes() / intervalMins) * intervalMins
      );
    }
    while (cursor.getTime() <= end) {
      ticks.push(cursor.getTime());
      cursor.setTime(cursor.getTime() + intervalMs);
    }
    return ticks;
  };

  const historicalTicks = useMemo(() => {
    if (!filteredDataWithTs) return [];
    const intervalMs =
      timeRange === "5d"
        ? TIME_PERIODS.TWENTY_FOUR_HOURS
        : timeRange === "24h"
          ? TIME_PERIODS.SIX_HOURS
          : timeRange === "8h"
            ? TIME_PERIODS.TWO_HOURS
            : 15 * 60 * 1000; // 1h → every 15 min
    return makeTicks(filteredDataWithTs, intervalMs);
  }, [filteredDataWithTs, timeRange]);

  // Combined dataset for the "forecast" view: a short run-up of actual readings
  // followed by the full forecast series, joined at the current level so the
  // line is continuous. The run-up is deliberately shorter than the forecast
  // it precedes - just enough to read the current trend into the forecast,
  // without giving equal billing to history in a view that's about what's
  // coming next.
  const combinedForecastData = useMemo(() => {
    if (!data || !forecastData) return null;
    const now = new Date();
    const runUp = data.filter(
      (d) =>
        new Date(d.dateTime) >
        new Date(now.getTime() - TIME_PERIODS.EIGHT_HOURS)
    );
    const historical = runUp.map((d) => ({
      ts: new Date(d.dateTime).getTime(),
      actual: d.level,
      forecasted: null as number | null,
    }));
    const future = forecastData.map((d) => ({
      ts: new Date(d.dateTime).getTime(),
      actual: null as number | null,
      forecasted: d.level,
    }));
    if (runUp.length > 0) {
      const latest = runUp[runUp.length - 1];
      future.unshift({
        ts: new Date(latest.dateTime).getTime(),
        actual: null,
        forecasted: latest.level,
      });
    }
    return [...historical, ...future];
  }, [data, forecastData]);

  const forecastYDomainMax = useMemo(() => {
    if (!combinedForecastData) return 6;
    const allLevels = combinedForecastData.flatMap((d) =>
      [d.actual, d.forecasted].filter((v): v is number => v !== null)
    );
    if (allLevels.length === 0) return 6;
    return Math.max(Math.ceil(Math.max(...allLevels)), 1);
  }, [combinedForecastData]);

  // Every 8 hours across the forecast view's ~32h span, which keeps roughly
  // the same label density as the 24h historical view. (At the previous 12h
  // spacing the shorter span would only fit two or three labels.)
  const forecastTicks = useMemo(() => {
    if (!combinedForecastData) return [];
    return makeTicks(combinedForecastData, TIME_PERIODS.EIGHT_HOURS);
  }, [combinedForecastData]);

  // Forecasted change over the next 24 hours: forecasted level at now+24h minus current actual level
  const forecastedChange24h = useMemo(() => {
    if (
      !forecastData ||
      forecastData.length === 0 ||
      !data ||
      data.length === 0
    )
      return null;
    const currentLevel = data[data.length - 1].level;
    const latestTs = new Date(data[data.length - 1].dateTime).getTime();
    const target = new Date(latestTs + TIME_PERIODS.TWENTY_FOUR_HOURS);
    let closest: ChartDataPoint | null = null;
    let minDiff = Infinity;
    for (const pt of forecastData) {
      const diff = Math.abs(new Date(pt.dateTime).getTime() - target.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closest = pt;
      }
    }
    if (!closest) return null;
    return closest.level - currentLevel;
  }, [forecastData, data]);

  const formatXAxis = (tickItem: number) => {
    const date = new Date(tickItem);
    if (timeRange === "5d") {
      return formatAxisDate(date);
    }
    return formatAxisTime(date);
  };

  const formatForecastTick = (ts: number) => formatAxisTime(new Date(ts));

  const renderChartBody = () => {
    if (timeRange === "forecast" && combinedForecastData) {
      const nowTs = new Date().getTime();
      return (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart
            data={combinedForecastData}
            // Wider right margin than the historical views: this axis can
            // place a tick on the very last point, and half of that centred
            // label would otherwise be clipped by the chart edge.
            margin={{ top: 5, right: 32, left: 5, bottom: 5 }}
            {...chartMoveProps}
          >
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={theme.palette.primary.main}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={theme.palette.primary.main}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
            />
            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={forecastTicks}
              tickFormatter={formatForecastTick}
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              domain={[0, forecastYDomainMax]}
            />
            <Tooltip
              content={CustomTooltip}
              active={tooltipActive}
              wrapperStyle={{ pointerEvents: "none" }}
            />
            <ReferenceLine
              x={nowTs}
              stroke={theme.palette.text.disabled}
              strokeDasharray="3 3"
            />
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey="actual"
              stroke={theme.palette.primary.main}
              fillOpacity={1}
              fill="url(#colorActual)"
              connectNulls={false}
              dot={false}
            />
            {/* forecastData only holds upstream-backed hours (lib/buildKayakData.ts). */}
            <Line
              isAnimationActive={false}
              type="monotone"
              dataKey="forecasted"
              stroke={theme.palette.primary.main}
              strokeDasharray={FORECAST_LINE_DASH.upstream}
              strokeOpacity={0.7}
              dot={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    if (filteredData) {
      return (
        // Keyed on the range so each one draws in afresh (chartMotion).
        <ResponsiveContainer key={timeRange} width="100%" height={200}>
          <ComposedChart
            data={filteredDataWithTs ?? undefined}
            margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
            {...chartMoveProps}
          >
            <defs>
              <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={theme.palette.primary.main}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={theme.palette.primary.main}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
            />
            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={historicalTicks}
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              domain={[0, yDomainMax]}
            />
            <Tooltip
              content={CustomTooltip}
              active={tooltipActive}
              wrapperStyle={{ pointerEvents: "none" }}
            />
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey="level"
              stroke={theme.palette.primary.main}
              fillOpacity={1}
              fill="url(#colorLevel)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }
    return (
      <Typography variant="body1" sx={{ mt: 1, textAlign: "center" }}>
        No data yet
      </Typography>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Skeleton
          variant="rounded"
          width="100%"
          height={200}
          animation="wave"
        />
      );
    }
    return (
      <Grow in appear {...springTransition()}>
        <Box ref={chartRef} sx={chartRevealSx}>
          {renderChartBody()}
        </Box>
      </Grow>
    );
  };

  return (
    <Card sx={{ width: "100%" }}>
      <CardContent>
        <Typography variant="h5" component="div">
          River Level
        </Typography>
        {loading ? (
          <Box sx={{ mt: 1, mb: 2, display: "flex", gap: 1 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={46}
                animation="wave"
                sx={{ flex: 1 }}
              />
            ))}
          </Box>
        ) : (
          <>
            {dataAgeLabel && (
              <Typography
                variant="caption"
                color="text.disabled"
                // No fontSize override: 0.7rem sat between M3's Body Small and
                // Label Small, so the label was the one piece of text on the
                // card that belonged to no step of the type scale.
                sx={{ display: "block", textAlign: "right", mt: 1 }}
              >
                As of {dataAgeLabel}
              </Typography>
            )}
            <SlidingToggleButtonGroup
              value={selectedRange}
              exclusive
              onChange={(_event, newTimeRange) => {
                if (newTimeRange) {
                  setSelectedRange(newTimeRange);
                }
              }}
              aria-label="time range"
              sx={{ mt: 0.5, mb: 2, width: "100%" }}
            >
              {/* Ordered as a timeline: furthest back on the left through to
                  the forecast on the right, so moving right always means
                  moving forward in time. */}
              <ToggleButton value="5d" aria-label="5 days" sx={{ flex: 1 }}>
                <Typography variant="caption">5d</Typography>
              </ToggleButton>
              <ToggleButton value="24h" aria-label="24 hours" sx={{ flex: 1 }}>
                <Typography variant="caption">24h</Typography>
              </ToggleButton>
              <ToggleButton value="8h" aria-label="8 hours" sx={{ flex: 1 }}>
                <Typography variant="caption">8h</Typography>
              </ToggleButton>
              <ToggleButton value="1h" aria-label="1 hour" sx={{ flex: 1 }}>
                <Typography variant="caption">1h</Typography>
              </ToggleButton>
              <ToggleButton
                value="forecast"
                aria-label="forecast"
                sx={{ flex: 1 }}
              >
                <Typography variant="caption">Forecast</Typography>
              </ToggleButton>
            </SlidingToggleButtonGroup>
          </>
        )}
        {renderContent()}
        <Divider sx={{ mt: 2 }} />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 1,
            mt: 2,
          }}
        >
          <ChangeIndicator
            period="1h Change"
            change={change1h}
            icon={<History />}
            loading={loading}
          />
          <ChangeIndicator
            period="8h Change"
            change={change8h}
            icon={<History />}
            loading={loading}
          />
          <ChangeIndicator
            period="24h Change"
            change={change24h}
            icon={<History />}
            loading={loading}
          />
          <ChangeIndicator
            period="5d Change"
            change={change5d}
            icon={<CalendarToday />}
            loading={loading}
          />
        </Box>
        <Box sx={{ mt: 1 }}>
          <ChangeIndicator
            period="24h Forecast"
            change={forecastedChange24h}
            icon={<Update />}
            loading={loading}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default RiverLevelGraph;

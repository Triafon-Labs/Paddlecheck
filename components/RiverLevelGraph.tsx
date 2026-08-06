"use client";

import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  History,
  CalendarToday,
  Update,
} from "@mui/icons-material";
import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  useTheme,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
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
import { useNowTicking, formatDataAge } from "@/lib/time";
import { TIME_PERIODS } from "@/lib/config";
import { formatRiverLevel } from "@/lib/units";
import { STORAGE_KEYS } from "@/lib/storageKeys";

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
  const changeStr = rounded !== null ? formatRiverLevel(Math.abs(rounded)) : null;
  const isFlat = rounded !== null && rounded === 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "action.hover",
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", color: "primary.main" }}
      >
        {loading ? (
          <>
            <Skeleton variant="circular" width={24} height={24} animation="wave" />
            <Skeleton
              variant="text"
              width={70}
              height={20}
              animation="wave"
              sx={{ ml: 0.5 }}
            />
          </>
        ) : (
          <>
            {icon}
            <Typography variant="subtitle2" color="text.secondary" sx={{ ml: 0.5 }}>
              {period}
            </Typography>
          </>
        )}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
        {loading ? (
          <Skeleton variant="text" width={50} height={32} animation="wave" />
        ) : (
          <Typography variant="h6" component="span">
            {rounded !== null ? (
              isFlat ? (
                <TrendingFlat sx={{ color: "text.secondary", mr: 0.5 }} />
              ) : rounded > 0 ? (
                <TrendingUp sx={{ color: "error.main", mr: 0.5 }} />
              ) : (
                <TrendingDown sx={{ color: "success.main", mr: 0.5 }} />
              )
            ) : null}
            {changeStr !== null ? changeStr : "N/A"}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipContentProps<ValueType, NameType>) => {
  if (active && payload && payload.length && label) {
    const value = payload[0].value as number;
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
      <Paper sx={{ p: 2 }}>
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
  const [timeRange, setTimeRange] = useState(
    () =>
      (typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEYS.RIVER_GRAPH_TIME_RANGE)
        : null) ?? "24h"
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RIVER_GRAPH_TIME_RANGE, timeRange);
  }, [timeRange]);

  const now = useNowTicking();

  const dataAgeLabel = useMemo(() => {
    if (!data || data.length === 0) return null;
    return formatDataAge(new Date(data[data.length - 1].dateTime).getTime(), now);
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
    () => filteredData?.map((d) => ({ ts: new Date(d.dateTime).getTime(), level: d.level })) ?? null,
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
      cursor.setHours(Math.ceil(cursor.getHours() / intervalHours) * intervalHours);
    } else {
      const intervalMins = intervalMs / (60 * 1000);
      cursor.setSeconds(0, 0);
      cursor.setMinutes(Math.ceil(cursor.getMinutes() / intervalMins) * intervalMins);
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
      timeRange === "5d" ? TIME_PERIODS.TWENTY_FOUR_HOURS :
      timeRange === "24h" ? TIME_PERIODS.SIX_HOURS :
      timeRange === "8h"  ? TIME_PERIODS.TWO_HOURS :
                            15 * 60 * 1000; // 1h → every 15 min
    return makeTicks(filteredDataWithTs, intervalMs);
  }, [filteredDataWithTs, timeRange]);

  // Combined dataset for the "forecast" view: last 24h of actual readings followed
  // by the full forecast series, joined at the current level so the line is continuous.
  const combinedForecastData = useMemo(() => {
    if (!data || !forecastData) return null;
    const now = new Date();
    const last24h = data.filter(
      (d) =>
        new Date(d.dateTime) >
        new Date(now.getTime() - TIME_PERIODS.TWENTY_FOUR_HOURS)
    );
    const historical = last24h.map((d) => ({
      ts: new Date(d.dateTime).getTime(),
      actual: d.level,
      forecasted: null as number | null,
    }));
    const future = forecastData.map((d) => ({
      ts: new Date(d.dateTime).getTime(),
      actual: null as number | null,
      forecasted: d.level,
    }));
    if (last24h.length > 0) {
      const latest = last24h[last24h.length - 1];
      future.unshift({ ts: new Date(latest.dateTime).getTime(), actual: null, forecasted: latest.level });
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

  // Evenly-spaced ticks every 12 hours for the forecast view
  const forecastTicks = useMemo(() => {
    if (!combinedForecastData) return [];
    return makeTicks(combinedForecastData, TIME_PERIODS.TWELVE_HOURS);
  }, [combinedForecastData]);

  // Forecasted change over the next 24 hours: forecasted level at now+24h minus current actual level
  const forecastedChange24h = useMemo(() => {
    if (!forecastData || forecastData.length === 0 || !data || data.length === 0) return null;
    const currentLevel = data[data.length - 1].level;
    const latestTs = new Date(data[data.length - 1].dateTime).getTime();
    const target = new Date(latestTs + TIME_PERIODS.TWENTY_FOUR_HOURS);
    let closest: ChartDataPoint | null = null;
    let minDiff = Infinity;
    for (const pt of forecastData) {
      const diff = Math.abs(new Date(pt.dateTime).getTime() - target.getTime());
      if (diff < minDiff) { minDiff = diff; closest = pt; }
    }
    if (!closest) return null;
    return closest.level - currentLevel;
  }, [forecastData, data]);

  const formatXAxis = (tickItem: number) => {
    const date = new Date(tickItem);
    if (timeRange === "5d") {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatForecastTick = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const renderContent = () => {
    if (loading) {
      return (
        <Skeleton variant="rounded" width="100%" height={200} animation="wave" />
      );
    }
    if (timeRange === "forecast" && combinedForecastData) {
      const nowTs = new Date().getTime();
      return (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart
              data={combinedForecastData}
              margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
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
              <YAxis stroke={theme.palette.text.secondary} domain={[0, forecastYDomainMax]} />
              <Tooltip content={CustomTooltip} />
              <ReferenceLine
                x={nowTs}
                stroke={theme.palette.text.disabled}
                strokeDasharray="3 3"
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke={theme.palette.primary.main}
                fillOpacity={1}
                fill="url(#colorActual)"
                connectNulls={false}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="forecasted"
                stroke={theme.palette.primary.main}
                strokeDasharray="5 5"
                strokeOpacity={0.7}
                dot={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", textAlign: "center", mt: 1 }}
          >
            Dashed line uses Bewdley upstream forecast (24h). For guidance only.
          </Typography>
        </>
      );
    }

    if (filteredData) {
      return (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart
            data={filteredDataWithTs ?? undefined}
            margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
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
            <Tooltip content={CustomTooltip} />
            <Area
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

  return (
    <Card variant="outlined" sx={{ width: "100%", p: 2 }}>
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
                sx={{ display: "block", textAlign: "right", fontSize: "0.7rem", mt: 1 }}
              >
                As of {dataAgeLabel}
              </Typography>
            )}
            <ToggleButtonGroup
              value={timeRange}
              exclusive
              onChange={(_event, newTimeRange) => {
                if (newTimeRange) {
                  setTimeRange(newTimeRange);
                }
              }}
              aria-label="time range"
              sx={{ mt: 0.5, mb: 2, width: "100%" }}
            >
              <ToggleButton value="forecast" aria-label="forecast" sx={{ flex: 1 }}>
                <Typography variant="caption">Forecast</Typography>
              </ToggleButton>
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
            </ToggleButtonGroup>
          </>
        )}
        {renderContent()}
        <Divider sx={{ mt: 2 }} />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 2,
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
        <Box sx={{ mt: 2 }}>
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

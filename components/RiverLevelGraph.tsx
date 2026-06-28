"use client";

import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Schedule,
  Update,
  CalendarToday,
  AccessTime,
  Timeline,
} from "@mui/icons-material";
import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  useTheme,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
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

interface RiverLevelGraphProps {
  data: ChartDataPoint[] | null;
  predictionData: ChartDataPoint[] | null;
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
}> = ({ period, change, icon }) => {
  const changeStr = change !== null ? change.toFixed(2) : null;
  const isFlat = changeStr === "0.00" || changeStr === "-0.00";

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}
      >
        {icon}
        <Typography variant="subtitle2" sx={{ ml: 0.5 }}>
          {period}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
        <Typography variant="h6" component="span">
          {change !== null ? (
            isFlat ? (
              <TrendingFlat sx={{ color: "warning.main", mr: 0.5 }} />
            ) : change > 0 ? (
              <TrendingUp sx={{ color: "error.main", mr: 0.5 }} />
            ) : (
              <TrendingDown sx={{ color: "success.main", mr: 0.5 }} />
            )
          ) : null}
          {change !== null ? (isFlat ? `0.00m` : `${changeStr}m`) : "N/A"}
        </Typography>
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
    // label is either an ISO string (historical views) or a numeric timestamp (pred view)
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
        <Typography variant="body2">{`${value.toFixed(2)}m`}</Typography>
      </Paper>
    );
  }

  return null;
};

const RiverLevelGraph: React.FC<RiverLevelGraphProps> = ({
  data,
  predictionData,
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
        ? localStorage.getItem("riverGraphTimeRange")
        : null) ?? "24h"
  );

  useEffect(() => {
    localStorage.setItem("riverGraphTimeRange", timeRange);
  }, [timeRange]);

  const filteredData = useMemo(() => {
    if (!data || timeRange === "pred") return null;

    const now = new Date();
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

    const filterDate = new Date(now.getTime() - hoursToFilter * 60 * 60 * 1000);

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
    if (intervalMs >= 60 * 60 * 1000) {
      const intervalHours = intervalMs / (60 * 60 * 1000);
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
      timeRange === "5d" ? 24 * 60 * 60 * 1000 :
      timeRange === "24h" ? 6 * 60 * 60 * 1000 :
      timeRange === "8h"  ? 2 * 60 * 60 * 1000 :
                            15 * 60 * 1000; // 1h → every 15 min
    return makeTicks(filteredDataWithTs, intervalMs);
  }, [filteredDataWithTs, timeRange]);

  // Combined dataset for the "pred" view: last 24h of actual readings followed
  // by the full prediction series, joined at the current level so the line is continuous.
  const combinedPredData = useMemo(() => {
    if (!data || !predictionData) return null;
    const now = new Date();
    const last24h = data.filter(
      (d) => new Date(d.dateTime) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
    );
    const historical = last24h.map((d) => ({
      ts: new Date(d.dateTime).getTime(),
      actual: d.level,
      predicted: null as number | null,
    }));
    const future = predictionData.map((d) => ({
      ts: new Date(d.dateTime).getTime(),
      actual: null as number | null,
      predicted: d.level,
    }));
    if (last24h.length > 0) {
      const latest = last24h[last24h.length - 1];
      future.unshift({ ts: new Date(latest.dateTime).getTime(), actual: null, predicted: latest.level });
    }
    return [...historical, ...future];
  }, [data, predictionData]);

  const predYDomainMax = useMemo(() => {
    if (!combinedPredData) return 6;
    const allLevels = combinedPredData.flatMap((d) =>
      [d.actual, d.predicted].filter((v): v is number => v !== null)
    );
    if (allLevels.length === 0) return 6;
    return Math.max(Math.ceil(Math.max(...allLevels)), 1);
  }, [combinedPredData]);

  // One tick per calendar day (midnight) for the pred view
  const predTicks = useMemo(() => {
    if (!combinedPredData || combinedPredData.length === 0) return [];
    const start = new Date(combinedPredData[0].ts);
    const end = new Date(combinedPredData[combinedPredData.length - 1].ts);
    const ticks: number[] = [];
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    cursor.setDate(cursor.getDate() + 1); // first midnight after start
    while (cursor <= end) {
      ticks.push(cursor.getTime());
      cursor.setDate(cursor.getDate() + 1);
    }
    return ticks;
  }, [combinedPredData]);

  // Predicted change over the next 24 hours: predicted level at now+24h minus current actual level
  const predictedChange24h = useMemo(() => {
    if (!predictionData || predictionData.length === 0 || !data || data.length === 0) return null;
    const currentLevel = data[data.length - 1].level;
    const latestTs = new Date(data[data.length - 1].dateTime).getTime();
    const target = new Date(latestTs + 24 * 60 * 60 * 1000);
    let closest: ChartDataPoint | null = null;
    let minDiff = Infinity;
    for (const pt of predictionData) {
      const diff = Math.abs(new Date(pt.dateTime).getTime() - target.getTime());
      if (diff < minDiff) { minDiff = diff; closest = pt; }
    }
    if (!closest) return null;
    return closest.level - currentLevel;
  }, [predictionData, data]);

  const formatXAxis = (tickItem: number) => {
    const date = new Date(tickItem);
    if (timeRange === "5d") {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatPredTick = (ts: number) =>
    new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (timeRange === "pred" && combinedPredData) {
      const nowTs = new Date().getTime();
      return (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={combinedPredData}>
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
                ticks={predTicks}
                tickFormatter={formatPredTick}

                interval={0}
              />
              <YAxis stroke={theme.palette.text.secondary} domain={[0, predYDomainMax]} />
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
                dataKey="predicted"
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
            Dashed line uses Bewdley upstream forecast (24h prediction). Experimental and may not be accurate.
          </Typography>
        </>
      );
    }

    if (filteredData) {
      return (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={filteredDataWithTs ?? undefined}>
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
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={(event, newTimeRange) => {
            if (newTimeRange) {
              setTimeRange(newTimeRange);
            }
          }}
          aria-label="time range"
          sx={{ mt: 1, mb: 2, width: "100%" }}
        >
          <ToggleButton value="pred" aria-label="prediction" sx={{ flex: 1 }}>
            <Typography variant="caption">Pred</Typography>
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
        {renderContent()}
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
            icon={<AccessTime />}
          />
          <ChangeIndicator
            period="8h Change"
            change={change8h}
            icon={<Schedule />}
          />
          <ChangeIndicator
            period="24h Change"
            change={change24h}
            icon={<Update />}
          />
          <ChangeIndicator
            period="5d Change"
            change={change5d}
            icon={<CalendarToday />}
          />
        </Box>
        <Box sx={{ mt: 2 }}>
          <ChangeIndicator
            period="Predicted Change Next 24 Hours"
            change={predictedChange24h}
            icon={<Timeline />}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default RiverLevelGraph;

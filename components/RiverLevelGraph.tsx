"use client";

import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Schedule,
  Update,
  CalendarToday,
  AccessTime,
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
  Slider,
} from "@mui/material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipContentProps,
} from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import { ChartDataPoint } from "@/types";

interface RiverLevelGraphProps {
  data: ChartDataPoint[] | null;
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
    const date = new Date(label);
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
  loading,
  change1h,
  change24h,
  change8h,
  change5d,
}) => {
  const theme = useTheme();
  const TIME_RANGES = ["1h", "8h", "24h", "5d"] as const;
  type TimeRange = (typeof TIME_RANGES)[number];
  const [timeRangeIndex, setTimeRangeIndex] = useState(2); // default 24h

  useEffect(() => {
    const saved = localStorage.getItem("riverGraphTimeRange");
    if (saved) {
      const idx = TIME_RANGES.indexOf(saved as TimeRange);
      if (idx !== -1) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTimeRangeIndex(idx);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("riverGraphTimeRange", TIME_RANGES[timeRangeIndex]);
  }, [timeRangeIndex]);

  const timeRange = TIME_RANGES[timeRangeIndex];

  const filteredData = useMemo(() => {
    if (!data) return null;
    const now = new Date();
    const hoursMap: Record<TimeRange, number | null> = { "1h": 1, "8h": 8, "24h": 24, "5d": null };
    const hours = hoursMap[timeRange];
    if (hours === null) return data;
    const filterDate = new Date(now.getTime() - hours * 60 * 60 * 1000);
    return data.filter((d) => new Date(d.dateTime) > filterDate);
  }, [data, timeRange]);

  const yDomainMax = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return 6;
    const maxLevel = Math.max(...filteredData.map((d) => d.level));
    const roundedMax = Math.ceil(maxLevel);
    return roundedMax > 0 ? roundedMax : 6;
  }, [filteredData]);

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    if (timeRange === "5d") {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (filteredData) {
      return (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={filteredData}>
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
              <XAxis dataKey="dateTime" tickFormatter={formatXAxis} />
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
            </AreaChart>
          </ResponsiveContainer>
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
        </>
      );
    }
    return (
      <Typography variant="body1" sx={{ mt: 1, textAlign: "center" }}>
        No data yet
      </Typography>
    );
  };

  return (
    <Card variant="outlined" sx={{ width: "100%", mt: 2, p: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Typography variant="h5" component="div">
              River Level
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Last 5 Days
            </Typography>
          </div>
          <Box sx={{ width: 120, mr: 1 }}>
            <Slider
              value={timeRangeIndex}
              onChange={(_, val) => setTimeRangeIndex(val as number)}
              min={0}
              max={TIME_RANGES.length - 1}
              step={1}
              marks={TIME_RANGES.map((label, i) => ({ value: i, label }))}
              track={false}
              size="small"
            />
          </Box>
        </Box>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default RiverLevelGraph;

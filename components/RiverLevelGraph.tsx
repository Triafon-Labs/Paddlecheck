'use client';

import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Schedule,
  Update,
  CalendarToday,
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
  change24h: number | null;
  change8h: number | null;
  change5d: number | null;
}

const ChangeIndicator: React.FC<{
  period: string;
  change: number | null;
  icon: React.ReactNode;
}> = ({ period, change, icon }) => (
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
          change > 0 ? (
            <TrendingUp sx={{ color: "error.main", mr: 0.5 }} />
          ) : change < 0 ? (
            <TrendingDown sx={{ color: "success.main", mr: 0.5 }} />
          ) : (
            <TrendingFlat sx={{ mr: 0.5 }} />
          )
        ) : null}
        {change !== null ? `${change.toFixed(2)}m` : "N/A"}
      </Typography>
    </Box>
  </Paper>
);

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipContentProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const value = payload[0].value as number;
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="body1">{`Time: ${new Date(
          label
        ).toLocaleString()}`}</Typography>
        <Typography variant="body2">{`Level: ${value.toFixed(2)}m`}</Typography>
      </Paper>
    );
  }

  return null;
};

const RiverLevelGraph: React.FC<RiverLevelGraphProps> = ({
  data,
  loading,
  change24h,
  change8h,
  change5d,
}) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState("24h");

  useEffect(() => {
    const savedTimeRange = localStorage.getItem("riverGraphTimeRange");
    if (savedTimeRange) {
      setTimeRange(savedTimeRange);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("riverGraphTimeRange", timeRange);
  }, [timeRange]);

  const filteredData = useMemo(() => {
    if (!data) return null;

    const now = new Date();
    let hoursToFilter;
    if (timeRange === "24h") {
      hoursToFilter = 24;
    } else if (timeRange === "8h") {
      hoursToFilter = 8;
    } else {
      return data;
    }

    const filterDate = new Date(now.getTime() - hoursToFilter * 60 * 60 * 1000);

    return data.filter((d) => new Date(d.dateTime) > filterDate);
  }, [data, timeRange]);

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
          <ResponsiveContainer width="100%" height={300}>
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
              <YAxis stroke={theme.palette.text.secondary} />
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
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 2,
              mt: 2,
            }}
          >
            <ChangeIndicator
              period="5d Change"
              change={change5d}
              icon={<CalendarToday />}
            />
            <ChangeIndicator
              period="24h Change"
              change={change24h}
              icon={<Update />}
            />
            <ChangeIndicator
              period="8h Change"
              change={change8h}
              icon={<Schedule />}
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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Typography variant="h5" component="div">
              River Level
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Last 5 Days
            </Typography>
          </div>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(event, newTimeRange) => {
              if (newTimeRange) {
                setTimeRange(newTimeRange);
              }
            }}
            aria-label="time range"
          >
            <ToggleButton value="5d" aria-label="5 days">
              <Typography variant="caption">5d</Typography>
            </ToggleButton>
            <ToggleButton value="24h" aria-label="24 hours">
              <Typography variant="caption">24h</Typography>
            </ToggleButton>
            <ToggleButton value="8h" aria-label="8 hours">
              <Typography variant="caption">8h</Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default RiverLevelGraph;
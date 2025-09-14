"use client";

import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Schedule,
  Update,
} from "@mui/icons-material";
import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  useTheme,
  Paper,
} from "@mui/material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { ChartDataPoint } from "@/types";

interface RiverLevelGraphProps {
  data: ChartDataPoint[] | null;
  loading: boolean;
  change24h: number | null;
  change8h: number | null;
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
    <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}>
      {icon}
      <Typography variant="subtitle2" sx={{ ml: 0.5 }}>
        {period}
      </Typography>
    </Box>
    <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
      <Typography variant="h6" component="span">
        {change !== null ? (
          change > 0 ? (
            <TrendingUp sx={{ color: "success.main", mr: 0.5 }} />
          ) : change < 0 ? (
            <TrendingDown sx={{ color: "error.main", mr: 0.5 }} />
          ) : (
            <TrendingFlat sx={{ mr: 0.5 }} />
          )
        ) : null}
        {change !== null ? `${change.toFixed(2)}m` : "N/A"}
      </Typography>
    </Box>
  </Paper>
);

const RiverLevelGraph: React.FC<RiverLevelGraphProps> = ({
  data,
  loading,
  change24h,
  change8h,
}) => {
  const theme = useTheme();

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (data) {
      return (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
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
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis dataKey="time" stroke={theme.palette.text.secondary} />
              <YAxis stroke={theme.palette.text.secondary} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  borderColor: theme.palette.divider,
                }}
                formatter={(value: number) => [
                  `${value.toFixed(2)}m`,
                  "River Level",
                ]}
                labelFormatter={(label: string) => `Time: ${label}`}
              />
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
        <Typography variant="h5" component="div" gutterBottom>
          River Level (Last 24 Hours)
        </Typography>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default RiverLevelGraph;

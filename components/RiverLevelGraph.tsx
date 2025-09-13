"use client";

import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Schedule,
  Update,
} from "@mui/icons-material";
import React, { useState, useEffect } from "react";
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

// Define interfaces for type safety
interface RiverReading {
  dateTime: string;
  value: number;
}

interface ApiResponse {
  items: RiverReading[];
}

interface ChartDataPoint {
  time: string;
  level: number;
}

interface RiverLevelGraphProps {
  // Add any props you might need in the future
  stationId?: string;
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
  stationId = "2642",
}) => {
  const theme = useTheme();
  const [data, setData] = useState<ChartDataPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [change24h, setChange24h] = useState<number | null>(null);
  const [change8h, setChange8h] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const twentyFourHoursAgo = new Date(
          new Date().getTime() - 24 * 60 * 60 * 1000
        ).toISOString();
        const response = await fetch(
          `https://environment.data.gov.uk/flood-monitoring/id/stations/${stationId}/readings?since=${twentyFourHoursAgo}`
        );
        const result: ApiResponse = await response.json();
        const sortedItems = result.items.sort(
          (a: RiverReading, b: RiverReading) =>
            new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
        );

        const formattedData: ChartDataPoint[] = sortedItems.map(
          (item: RiverReading) => ({
            time: new Date(item.dateTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            level: item.value,
          })
        );
        setData(formattedData);

        if (sortedItems.length > 1) {
          const latestLevel = sortedItems[sortedItems.length - 1].value;
          const oldestLevel24h = sortedItems[0].value;
          setChange24h(latestLevel - oldestLevel24h);

          const eightHoursAgo = new Date(
            new Date().getTime() - 8 * 60 * 60 * 1000
          );
          const eightHourIndex = sortedItems.findIndex(
            (item: RiverReading) => new Date(item.dateTime) >= eightHoursAgo
          );
          if (eightHourIndex !== -1) {
            const oldestLevel8h = sortedItems[eightHourIndex].value;
            setChange8h(latestLevel - oldestLevel8h);
          }
        }
      } catch (error) {
        console.error("Error fetching river level data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stationId]);

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

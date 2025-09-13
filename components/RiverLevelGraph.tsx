"use client";

import { TrendingUp, TrendingDown, TrendingFlat } from "@mui/icons-material";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Grid,
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

interface RiverLevelGraphProps {}

const RiverLevelGraph: React.FC<RiverLevelGraphProps> = () => {
  const [data, setData] = useState<any[] | null>(null);
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
          `https://environment.data.gov.uk/flood-monitoring/id/stations/2642/readings?since=${twentyFourHoursAgo}`
        );
        const result = await response.json();
        const sortedItems = result.items.sort(
          (a: any, b: any) =>
            new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
        );

        const formattedData = sortedItems.map((item: any) => ({
          time: new Date(item.dateTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          level: item.value,
        }));
        setData(formattedData);

        if (sortedItems.length > 1) {
          const latestLevel = sortedItems[sortedItems.length - 1].value;
          const oldestLevel24h = sortedItems[0].value;
          setChange24h(latestLevel - oldestLevel24h);

          const eightHoursAgo = new Date(
            new Date().getTime() - 8 * 60 * 60 * 1000
          );
          const eightHourIndex = sortedItems.findIndex(
            (item: any) => new Date(item.dateTime) >= eightHoursAgo
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
  }, []);

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
                  <stop offset="5%" stopColor="#2196f3" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2196f3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" domain={["dataMin", "dataMax"]} />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="level"
                stroke="#2196f3"
                fillOpacity={1}
                fill="url(#colorLevel)"
              />
            </AreaChart>
          </ResponsiveContainer>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 1,
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  24h Change
                </Typography>
                <Typography variant="h6">
                  {change24h !== null ? (
                    change24h > 0 ? (
                      <TrendingUp sx={{ color: "success.main", mr: 0.5 }} />
                    ) : change24h < 0 ? (
                      <TrendingDown sx={{ color: "error.main", mr: 0.5 }} />
                    ) : (
                      <TrendingFlat sx={{ mr: 0.5 }} />
                    )
                  ) : null}
                  {change24h !== null ? `${change24h.toFixed(2)}m` : 'N/A'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 1,
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  8h Change
                </Typography>
                <Typography variant="h6">
                  {change8h !== null ? (
                    change8h > 0 ? (
                      <TrendingUp sx={{ color: "success.main", mr: 0.5 }} />
                    ) : change8h < 0 ? (
                      <TrendingDown sx={{ color: "error.main", mr: 0.5 }} />
                    ) : (
                      <TrendingFlat sx={{ mr: 0.5 }} />
                    )
                  ) : null}
                  {change8h !== null ? `${change8h.toFixed(2)}m` : 'N/A'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
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
    <Card sx={{ minWidth: 275, width: "100%", mt: 2 }}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          River Level (Last 24 Hours)
        </Typography>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default RiverLevelGraph;

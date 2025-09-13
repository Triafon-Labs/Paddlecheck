"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Tooltip,
} from "@mui/material";
import WbSunny from "@mui/icons-material/WbSunny";
import Visibility from "@mui/icons-material/Visibility";
import TrendingUp from "@mui/icons-material/TrendingUp";
import TrendingDown from "@mui/icons-material/TrendingDown";
import TrendingFlat from "@mui/icons-material/TrendingFlat";
import Air from "@mui/icons-material/Air";
import { KayakConditions, Status } from "@/types";

interface StatsCardProps {
  conditions: KayakConditions | null;
}

const statusEmojis: Record<Status, string> = {
  Unknown: "🤷",
  "Light Green": "✅",
  "Dark Green": "✅",
  Amber: "🔶",
  Red: "❌",
  "No Paddling": "⛔",
};

const StatsCard: React.FC<StatsCardProps> = ({ conditions }) => {
  if (!conditions) {
    return null;
  }

  const initialStatusEmoji = statusEmojis[conditions.initialStatus!];

  return (
    <Card sx={{ minWidth: 275, width: "100%", mt: 2 }}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          Detailed Stats
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid>
            <Typography variant="h6">
              River Level: {conditions.riverLevel?.toFixed(2)}m
              {conditions.levelChange && (
                <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                  (
                  {conditions.levelChange.value > 0 ? (
                    <TrendingUp
                      sx={{ fontSize: "1rem", verticalAlign: "middle" }}
                    />
                  ) : conditions.levelChange.value < 0 ? (
                    <TrendingDown
                      sx={{ fontSize: "1rem", verticalAlign: "middle" }}
                    />
                  ) : (
                    <TrendingFlat
                      sx={{ fontSize: "1rem", verticalAlign: "middle" }}
                    />
                  )}
                  {conditions.levelChange.value.toFixed(2)}m in{" "}
                  {conditions.levelChange.period})
                </Typography>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {conditions.launchMessage}
            </Typography>
          </Grid>

          <Grid>
            <Typography variant="body1">
              Initial Status: {conditions.initialStatus} {initialStatusEmoji}
            </Typography>
          </Grid>

          <Grid>
            <Tooltip title="Temperature">
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <WbSunny sx={{ mr: 1, color: "text.secondary" }} />
                <Typography variant="body1">
                  {conditions.temperature?.toFixed(1)}°C
                </Typography>
              </Box>
            </Tooltip>
          </Grid>

          <Grid>
            <Tooltip title="Wind Speed">
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Air sx={{ mr: 1, color: "text.secondary" }} />
                <Typography variant="body1">
                  {conditions.windSpeed?.toFixed(1)} m/s
                </Typography>
              </Box>
            </Tooltip>
          </Grid>

          <Grid>
            <Tooltip title="Visibility">
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Visibility sx={{ mr: 1, color: "text.secondary" }} />
                <Typography variant="body1">
                  {conditions.visibility?.toFixed(1)} km
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
        </Grid>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "right", mt: 2 }}
        >
          Last updated: {new Date(conditions.lastUpdated!).toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default StatsCard;

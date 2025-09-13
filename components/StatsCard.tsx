"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tooltip,
} from "@mui/material";
import WbSunny from "@mui/icons-material/WbSunny";
import Visibility from "@mui/icons-material/Visibility";
import TrendingUp from "@mui/icons-material/TrendingUp";
import TrendingDown from "@mui/icons-material/TrendingDown";
import TrendingFlat from "@mui/icons-material/TrendingFlat";
import Air from "@mui/icons-material/Air";
import Water from "@mui/icons-material/Water";
import Info from "@mui/icons-material/Info";
import { KayakConditions } from "@/types";
import { ragStatus } from "@/lib/rag";

interface StatsCardProps {
  conditions: KayakConditions | null;
}

const StatItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tooltip?: string;
}> = ({ icon, label, value, tooltip }) => (
  <Tooltip title={tooltip || label} placement="top">
    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
      <Box sx={{ mr: 1.5, color: "primary.main" }}>{icon}</Box>
      <Box>
        <Typography variant="body1" component="div">
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </Box>
  </Tooltip>
);

const StatsCard: React.FC<StatsCardProps> = ({ conditions }) => {
  if (!conditions) {
    return null;
  }

  const { icon: InitialStatusIcon } =
    ragStatus[conditions.initialStatus!] || ragStatus.Unknown;

  return (
    <Card variant="outlined" sx={{ width: "100%", mt: 2, p: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Detailed Stats
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr 1fr",
            },
            gap: 2,
            mt: 1,
          }}
        >
          <Box>
            <StatItem
              icon={<Water />}
              label="River Level"
              value={
                <>
                  {conditions.riverLevel?.toFixed(2)}m
                  {conditions.levelChange && (
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ ml: 0.5, color: "text.secondary" }}
                    >
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
                </>
              }
            />
            <StatItem
              icon={<Info />}
              label="Launch Message"
              value={conditions.launchMessage}
            />
          </Box>
          <Box>
            <StatItem
              icon={<InitialStatusIcon />}
              label="Initial Status"
              value={conditions.initialStatus}
            />
            <StatItem
              icon={<WbSunny />}
              label="Temperature"
              value={`${conditions.temperature?.toFixed(1)}°C`}
            />
            <StatItem
              icon={<Air />}
              label="Wind Speed"
              value={`${conditions.windSpeed?.toFixed(1)} m/s`}
            />
            <StatItem
              icon={<Visibility />}
              label="Visibility"
              value={`${conditions.visibility?.toFixed(1)} km`}
            />
          </Box>
        </Box>
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

"use client";

import React from "react";
import { Card, CardContent, Typography, Box, Tooltip } from "@mui/material";
import Thermostat from "@mui/icons-material/Thermostat";
import Visibility from "@mui/icons-material/Visibility";
import TrendingUp from "@mui/icons-material/TrendingUp";
import TrendingDown from "@mui/icons-material/TrendingDown";
import TrendingFlat from "@mui/icons-material/TrendingFlat";
import Air from "@mui/icons-material/Air";
import Water from "@mui/icons-material/Water";
import Info from "@mui/icons-material/Info";
import WaterDrop from "@mui/icons-material/WaterDrop";
import NightsStay from "@mui/icons-material/NightsStay";
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
              label="Initial RAG Status"
              value={conditions.initialStatus}
            />
            <StatItem
              icon={<Thermostat />}
              label="Temperature"
              value={`${conditions.temperature?.toFixed(1)}°C`}
            />
            <StatItem
              icon={<Air />}
              label="Wind Speed"
              value={`${conditions.windSpeed?.toFixed(1)} mph`}
            />
            <StatItem
              icon={<Visibility />}
              label="Visibility"
              value={conditions.visibilityDescription}
            />
            {conditions.rain && (
              <StatItem icon={<WaterDrop />} label="Rain" value="Yes" />
            )}
            {conditions.dark && (
              <StatItem icon={<NightsStay />} label="Dark" value="Yes" />
            )}
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
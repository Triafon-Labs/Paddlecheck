"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  Grow,
} from "@mui/material";
import Thermostat from "@mui/icons-material/Thermostat";
import Visibility from "@mui/icons-material/Visibility";
import Air from "@mui/icons-material/Air";
import WaterDrop from "@mui/icons-material/WaterDrop";
import NightsStay from "@mui/icons-material/NightsStay";
import { KayakConditions } from "@/types";
import { degreesToCompass } from "@/lib/weather";
import { formatTemperature, formatWindSpeed } from "@/lib/units";
import { springTransition } from "@/lib/m3-palette";

interface StatsCardProps {
  conditions: KayakConditions | null;
  loading: boolean;
}

// No tooltip. Every tile wrapped one, defaulted to `tooltip || label` with no
// call site ever passing `tooltip` - so each tile popped a bubble repeating
// the label already printed underneath it. It hung off a plain Box too, which
// no keyboard or screen reader could reach, so the only people it spoke to
// were the ones who could already read it.
const StatItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
    <Box sx={{ mr: 1.5, color: "primary.main" }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" component="div">
        {value}
      </Typography>
    </Box>
  </Box>
);

const StatsCard: React.FC<StatsCardProps> = ({ conditions, loading }) => {
  if (loading) {
    return (
      <Card sx={{ width: "100%" }}>
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom>
            Detailed Stats
          </Typography>
          <Box sx={{ mt: 1 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Box
                key={i}
                sx={{ display: "flex", alignItems: "center", mb: 2 }}
              >
                <Skeleton
                  variant="circular"
                  width={24}
                  height={24}
                  animation="wave"
                  sx={{ mr: 1.5 }}
                />
                <Box>
                  <Skeleton
                    variant="text"
                    width={90}
                    height={16}
                    animation="wave"
                  />
                  <Skeleton
                    variant="text"
                    width={70}
                    height={24}
                    animation="wave"
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!conditions) {
    return null;
  }

  return (
    <Card sx={{ width: "100%" }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Detailed Stats
        </Typography>
        <Grow in appear {...springTransition()}>
          <Box sx={{ mt: 1 }}>
            <StatItem
              icon={<Thermostat />}
              label="Temperature"
              value={
                conditions.temperature !== undefined
                  ? formatTemperature(conditions.temperature)
                  : "N/A"
              }
            />
            <StatItem
              icon={<Air />}
              label="Wind Speed"
              value={
                conditions.windSpeed !== undefined
                  ? `${formatWindSpeed(conditions.windSpeed)}${conditions.windDirection !== undefined ? ` ${degreesToCompass(conditions.windDirection)}` : ""}`
                  : "N/A"
              }
            />
            <StatItem
              icon={<Visibility />}
              label="Visibility"
              value={conditions.visibilityDescription}
            />
            {conditions.rain && (
              <StatItem
                icon={<WaterDrop />}
                label="Rain"
                value={conditions.weatherDescription || "Yes"}
              />
            )}
            {conditions.dark && (
              <StatItem icon={<NightsStay />} label="Dark" value="Yes" />
            )}
          </Box>
        </Grow>
      </CardContent>
    </Card>
  );
};

export default StatsCard;

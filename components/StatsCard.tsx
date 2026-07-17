"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import Thermostat from "@mui/icons-material/Thermostat";
import Visibility from "@mui/icons-material/Visibility";
import Air from "@mui/icons-material/Air";
import Water from "@mui/icons-material/Water";
import WaterDrop from "@mui/icons-material/WaterDrop";
import NightsStay from "@mui/icons-material/NightsStay";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import { KayakConditions } from "@/types";
import { degreesToCompass } from "@/lib/weather";
import { THRESHOLDS } from "@/lib/config";

interface StatsCardProps {
  conditions: KayakConditions | null;
  loading: boolean;
  reasons: string[];
}

const StatItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tooltip?: string;
  isInfluencing?: boolean;
}> = ({ icon, label, value, tooltip, isInfluencing }) => (
  <Tooltip title={tooltip || label} placement="top">
    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
      <Box sx={{ mr: 1.5, color: "primary.main" }}>{icon}</Box>
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "flex", alignItems: "center" }}
        >
          {label}
          {isInfluencing && (
            <Box
              component="span"
              sx={{ display: "inline-flex", alignItems: "center", ml: 0.5 }}
            >
              🚦
              <ArrowUpward sx={{ fontSize: "inherit", color: "error.main" }} />
            </Box>
          )}
        </Typography>
        <Typography variant="body1" component="div">
          {value}
        </Typography>
      </Box>
    </Box>
  </Tooltip>
);

const StatsCard: React.FC<StatsCardProps> = ({ conditions, loading, reasons }) => {
  if (loading) {
    return (
      <Card variant="outlined" sx={{ width: "100%", p: 2 }}>
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom>
            Detailed Stats
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!conditions) {
    return null;
  }

  return (
    <Card variant="outlined" sx={{ width: "100%", p: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Detailed Stats
        </Typography>
        <Box sx={{ mt: 1 }}>
          <StatItem
            icon={<Water />}
            label="River Level"
            value={
              <>
                {conditions.riverLevel?.toFixed(2)}m
                {conditions.levelChange && (
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", fontStyle: "italic", ml: 0.5 }}
                  >
                    (
                    {conditions.levelChange.value > THRESHOLDS.RIVER_LEVEL_TREND_THRESHOLD
                      ? "and rising"
                      : conditions.levelChange.value < -THRESHOLDS.RIVER_LEVEL_TREND_THRESHOLD
                        ? "and falling"
                        : "and steady"}
                    )
                  </Typography>
                )}
              </>
            }
            isInfluencing={reasons.some((r) => r.includes("river level"))}
          />
          <StatItem
            icon={<Thermostat />}
            label="Temperature"
            value={`${conditions.temperature?.toFixed(1)}°C`}
            isInfluencing={reasons.some((r) => r.includes("temperature"))}
          />
          <StatItem
            icon={<Air />}
            label="Wind Speed"
            value={`${conditions.windSpeed?.toFixed(1)} mph${conditions.windDirection !== undefined ? ` ${degreesToCompass(conditions.windDirection)}` : ""}`}
            isInfluencing={reasons.includes("High winds")}
          />
          <StatItem
            icon={<Visibility />}
            label="Visibility"
            value={conditions.visibilityDescription}
            isInfluencing={reasons.includes("Foggy")}
          />
          {conditions.rain && (
            <StatItem
              icon={<WaterDrop />}
              label="Rain"
              value={conditions.weatherDescription || "Yes"}
              isInfluencing={reasons.includes("Rain")}
            />
          )}
          {conditions.dark && (
            <StatItem
              icon={<NightsStay />}
              label="Dark"
              value="Yes"
              isInfluencing={reasons.includes("Dark")}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard;

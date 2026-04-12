"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tooltip,
  CircularProgress,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import Thermostat from "@mui/icons-material/Thermostat";
import Visibility from "@mui/icons-material/Visibility";
import Air from "@mui/icons-material/Air";
import Water from "@mui/icons-material/Water";
import Info from "@mui/icons-material/Info";
import WaterDrop from "@mui/icons-material/WaterDrop";
import NightsStay from "@mui/icons-material/NightsStay";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import Kayaking from "@mui/icons-material/Kayaking";
import { KayakConditions } from "@/types";
import { ragStatus } from "@/lib/rag";
import { degreesToCompass } from "@/lib/weather";

interface StatsCardProps {
  conditions: KayakConditions | null;
  loading: boolean;
  reasons: string[];
}

const StatRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tooltip?: string;
  isInfluencing?: boolean;
}> = ({ icon, label, value, tooltip, isInfluencing }) => (
  <Tooltip title={tooltip || label} placement="left">
    <TableRow>
      <TableCell sx={{ width: 32, pl: 0, color: "primary.main" }}>
        {icon}
      </TableCell>
      <TableCell sx={{ color: "text.secondary" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="caption">{label}</Typography>
          {isInfluencing && (
            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", ml: 0.5 }}>
              🚦<ArrowUpward sx={{ fontSize: "inherit", color: "error.main" }} />
            </Box>
          )}
        </Box>
      </TableCell>
      <TableCell sx={{ pr: 0 }}>
        <Typography variant="body2" component="div">{value}</Typography>
      </TableCell>
    </TableRow>
  </Tooltip>
);

const StatsCard: React.FC<StatsCardProps> = ({ conditions, loading, reasons }) => {
  if (loading) {
    return (
      <Card variant="outlined" sx={{ width: "100%", mt: 2, p: 2 }}>
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

  const { icon: InitialStatusIcon } =
    ragStatus[conditions.initialStatus!] || ragStatus.Unknown;

  return (
    <Card variant="outlined" sx={{ width: "100%", mt: 2, p: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Detailed Stats
        </Typography>
        <Table size="small" sx={{ mt: 1 }}>
          <TableBody>
            <StatRow
              icon={<Water fontSize="small" />}
              label="River Level"
              value={
                <>
                  {conditions.riverLevel?.toFixed(2)}m
                  {conditions.levelChange && (
                    <Typography variant="caption" sx={{ color: "text.secondary", fontStyle: "italic", ml: 0.5 }}>
                      ({conditions.levelChange.value > 0.01
                        ? "rising"
                        : conditions.levelChange.value < -0.01
                          ? "falling"
                          : "steady"})
                    </Typography>
                  )}
                </>
              }
              isInfluencing={reasons.some((r) => r.includes("river level"))}
            />
            <StatRow
              icon={<Info fontSize="small" />}
              label="Launch Message"
              value={(() => {
                if (!conditions.launchMessage) return null;
                const match = conditions.launchMessage.match(/(.*?)\s*\((.*)\)/);
                if (match) {
                  return (
                    <>
                      {match[1]}
                      <Typography variant="caption" sx={{ color: "text.secondary", fontStyle: "italic", ml: 0.5 }}>
                        ({match[2]})
                      </Typography>
                    </>
                  );
                }
                return conditions.launchMessage;
              })()}
            />
            <StatRow
              icon={<InitialStatusIcon fontSize="small" />}
              label="Initial Status"
              value={conditions.initialStatus}
            />
            {conditions.pitchcroftPaddleability && (
              <StatRow
                icon={<Kayaking fontSize="small" />}
                label="Pitchcroft Paddleability"
                value={
                  <>
                    {conditions.pitchcroftPaddleability}
                    <Typography variant="caption" sx={{ color: "text.secondary", fontStyle: "italic", ml: 0.5 }}>
                      (at your own risk)
                    </Typography>
                  </>
                }
              />
            )}
            <StatRow
              icon={<Thermostat fontSize="small" />}
              label="Temperature"
              value={`${conditions.temperature?.toFixed(1)}°C`}
              isInfluencing={reasons.some((r) => r.includes("temperature"))}
            />
            <StatRow
              icon={<Air fontSize="small" />}
              label="Wind Speed"
              value={`${conditions.windSpeed?.toFixed(1)} mph${conditions.windDirection !== undefined ? ` ${degreesToCompass(conditions.windDirection)}` : ""}`}
              isInfluencing={reasons.includes("High winds")}
            />
            <StatRow
              icon={<Visibility fontSize="small" />}
              label="Visibility"
              value={conditions.visibilityDescription}
              isInfluencing={reasons.includes("Foggy")}
            />
            {conditions.rain && (
              <StatRow
                icon={<WaterDrop fontSize="small" />}
                label="Rain"
                value="Yes"
                isInfluencing={reasons.includes("Rain")}
              />
            )}
            {conditions.dark && (
              <StatRow
                icon={<NightsStay fontSize="small" />}
                label="Dark"
                value="Yes"
                isInfluencing={reasons.includes("Dark")}
              />
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default StatsCard;

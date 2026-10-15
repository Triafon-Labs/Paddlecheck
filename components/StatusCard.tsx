"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  Grow,
  Collapse,
} from "@mui/material";
import HelpOutlined from "@mui/icons-material/HelpOutlined";
import Air from "@mui/icons-material/Air";
import WaterDrop from "@mui/icons-material/WaterDrop";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import { KayakConditions } from "@/types";
import PaddlingStatusHero from "./PaddlingStatusHero";
import InfoPanel from "./InfoPanel";
import { ragStatus, reasonIcons, describeReason } from "@/lib/rag";
import { formatWindGust } from "@/lib/units";
import { collapseMotion, springTransition } from "@/lib/m3-palette";
import ConditionsBriefing from "./ConditionsBriefing";
import WeatherWarnings from "./WeatherWarnings";

interface StatusCardProps {
  conditions: KayakConditions | null;
  loading?: boolean;
}

// Mirrors the scale in PaddlingStatusHero so the skeleton lays out the same
// number of placeholder segments as the real strip.
const SCALE_SEGMENT_COUNT = (
  Object.keys(ragStatus) as (keyof typeof ragStatus)[]
).filter((s) => s !== "Unknown").length;

const StatusCard: React.FC<StatusCardProps> = ({ conditions, loading }) => {
  const renderContent = () => {
    if (loading) {
      return (
        <>
          <Box sx={{ mt: 2 }}>
            <Skeleton
              variant="rounded"
              height={120}
              animation="wave"
              sx={{ borderRadius: "28px" }}
            />
            <Box sx={{ display: "flex", gap: 0.75, mt: 1.5 }}>
              {Array.from({ length: SCALE_SEGMENT_COUNT }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  height={6}
                  animation="wave"
                  sx={{ flex: 1, borderRadius: 9999 }}
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Skeleton variant="text" width={140} height={20} animation="wave" />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 1,
                mt: 1,
                "& > *:last-of-type:nth-of-type(odd)": {
                  gridColumn: "1 / -1",
                },
              }}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  height={56}
                  animation="wave"
                />
              ))}
            </Box>
          </Box>

          <Skeleton
            variant="rounded"
            height={72}
            animation="wave"
            sx={{ mt: 2 }}
          />
        </>
      );
    }
    if (conditions) {
      return (
        <Grow in appear {...springTransition()}>
          <Box>
            {/* One panel for all six statuses, including No Paddling, which
                used to render as an entirely separate widget - so the top of
                the card changed shape depending on the reading. */}
            <Box sx={{ mt: 2 }}>
              <PaddlingStatusHero status={conditions.overallStatus} />
            </Box>

            <Collapse
              in={!!conditions.reasons && conditions.reasons.length > 0}
              unmountOnExit
              {...collapseMotion}
            >
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Contributing Factors
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 1,
                    mt: 1,
                    "& > *:last-of-type:nth-of-type(odd)": {
                      gridColumn: "1 / -1",
                    },
                  }}
                >
                  {conditions.reasons?.map((reason, index) => {
                    const Icon = reasonIcons[reason] ?? HelpOutlined;
                    const label = describeReason(reason, {
                      temperature: conditions.temperature,
                      windSpeed: conditions.windSpeed,
                    });
                    return (
                      <InfoPanel key={index}>
                        <Icon fontSize="small" sx={{ color: "primary.main" }} />
                        <Typography variant="body2">{label}</Typography>
                      </InfoPanel>
                    );
                  })}
                </Box>
              </Box>
            </Collapse>
            <Collapse
              in={!!(conditions.gustStatus || conditions.rainWhileWarm)}
              unmountOnExit
              {...collapseMotion}
            >
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Be Aware
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    mt: 1,
                  }}
                >
                  {conditions.gustStatus && (
                    <InfoPanel>
                      <Air fontSize="small" sx={{ color: "primary.main" }} />
                      <Typography variant="body2">
                        Gusts up to {formatWindGust(conditions.windGust!)}
                      </Typography>
                      <FiberManualRecord
                        titleAccess={`Would be ${conditions.gustStatus} if sustained`}
                        sx={{
                          fontSize: 8,
                          color: ragStatus[conditions.gustStatus].color,
                          flexShrink: 0,
                          ml: "auto",
                        }}
                      />
                    </InfoPanel>
                  )}
                  {conditions.rainWhileWarm && (
                    <InfoPanel>
                      <WaterDrop
                        fontSize="small"
                        sx={{ color: "primary.main" }}
                      />
                      <Typography variant="body2">
                        {conditions.weatherDescription || "Rain"}
                      </Typography>
                    </InfoPanel>
                  )}
                </Box>
              </Box>
            </Collapse>
            <WeatherWarnings warnings={conditions.warnings} />
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Conditions Report
              </Typography>
              <Box sx={{ mt: 1 }}>
                <ConditionsBriefing conditions={conditions} />
              </Box>
            </Box>
          </Box>
        </Grow>
      );
    }
    return (
      <Typography variant="body1" sx={{ mt: 1, textAlign: "center" }}>
        No data yet
      </Typography>
    );
  };

  return (
    <Card data-testid="status-card" sx={{ width: "100%" }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Paddling Status
        </Typography>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default StatusCard;

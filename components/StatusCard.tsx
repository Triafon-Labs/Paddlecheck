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
import TrafficLight from "./TrafficLight";
import InfoPanel from "./InfoPanel";
import { ragStatus, reasonIcons, describeReason } from "@/lib/rag";
import { formatWindGust } from "@/lib/units";
import { springTransition } from "@/lib/m3-palette";
import ConditionsBriefing from "./ConditionsBriefing";
import WeatherWarnings from "./WeatherWarnings";

interface StatusCardProps {
  conditions: KayakConditions | null;
  loading?: boolean;
}

// Mirrors the filtering in TrafficLight.tsx so the skeleton renders the same
// number of placeholder circles as the real traffic light.
const TRAFFIC_LIGHT_COUNT = (
  Object.keys(ragStatus) as (keyof typeof ragStatus)[]
).filter((s) => s !== "Unknown" && s !== "No Paddling").length;

const StatusCard: React.FC<StatusCardProps> = ({ conditions, loading }) => {
  const renderContent = () => {
    if (loading) {
      return (
        <>
          <Box
            sx={{
              mt: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              {Array.from({ length: TRAFFIC_LIGHT_COUNT }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="circular"
                  width={50}
                  height={50}
                  animation="wave"
                />
              ))}
            </Box>
            <Skeleton variant="text" width={100} height={32} animation="wave" />
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
      const isNoPaddling = conditions.overallStatus === "No Paddling";
      const noPaddlingStatusInfo = isNoPaddling
        ? ragStatus["No Paddling"]
        : null;
      const NoPaddlingIcon = noPaddlingStatusInfo?.icon;

      return (
        <Grow in appear {...springTransition()}>
          <Box>
            {isNoPaddling && NoPaddlingIcon ? (
              // The RAG red is one colour in both schemes, and on the navy
              // surfaces it only carries as a fill - as text on the tonal
              // panel this used to use, it sat at 1.4:1 against the dark
              // scheme's containerHighest. So the red moves to the panel
              // itself and the label rides on top of it, which is how every
              // other red surface in the app is built (the status chips, the
              // traffic-light lamps): saturated fill, white glyph.
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  mb: 2,
                  p: 2,
                  borderRadius: 1,
                  backgroundColor: "error.main",
                  color: "error.contrastText",
                }}
              >
                <NoPaddlingIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  No Paddling
                </Typography>
              </Box>
            ) : (
              <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                <TrafficLight status={conditions.overallStatus} />
              </Box>
            )}

            <Collapse
              in={!!conditions.reasons && conditions.reasons.length > 0}
              unmountOnExit
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
                AI Overview
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
    <Card
      data-testid="status-card"
      variant="outlined"
      sx={{ width: "100%", p: 2 }}
    >
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

"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Paper,
} from "@mui/material";
import { KayakConditions } from "@/types";
import TrafficLight from "./TrafficLight";
import { ragStatus, reasonIcons } from "@/lib/rag";
import ConditionsBriefing from "./ConditionsBriefing";
import WeatherWarnings from "./WeatherWarnings";

interface StatusCardProps {
  conditions: KayakConditions | null;
  loading?: boolean;
}

const StatusCard: React.FC<StatusCardProps> = ({ conditions, loading }) => {
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (conditions) {
      const isNoPaddling = conditions.overallStatus === "No Paddling";
      const noPaddlingStatusInfo = isNoPaddling
        ? ragStatus["No Paddling"]
        : null;
      const NoPaddlingIcon = noPaddlingStatusInfo?.icon;

      return (
        <>
          {isNoPaddling && NoPaddlingIcon ? (
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
                backgroundColor: noPaddlingStatusInfo.backgroundColor,
                border: `1px solid ${noPaddlingStatusInfo.color}`,
              }}
            >
              <NoPaddlingIcon
                sx={{ fontSize: 40, color: noPaddlingStatusInfo.color, mb: 1 }}
              />
              <Typography
                variant="h6"
                sx={{ color: noPaddlingStatusInfo.color, mb: 1 }}
              >
                No Paddling
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
              <TrafficLight status={conditions.overallStatus} />
            </Box>
          )}

          {conditions.reasons && conditions.reasons.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Contributing Factors
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                  gap: 1,
                  mt: 1,
                }}
              >
                {conditions.reasons.map((reason, index) => {
                  const Icon = reasonIcons[reason];
                  return (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 1.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        backgroundColor: "action.hover",
                      }}
                    >
                      {Icon && (
                        <Icon fontSize="small" sx={{ color: "primary.main" }} />
                      )}
                      <Typography variant="body2">{reason}</Typography>
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          )}
          <WeatherWarnings warnings={conditions.warnings} />
          <ConditionsBriefing conditions={conditions} label="AI Overview" />
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

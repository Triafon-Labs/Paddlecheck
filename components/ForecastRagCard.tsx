"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { KayakConditions } from "@/types";
import TrafficLight from "./TrafficLight";
import { ragStatus } from "@/lib/rag";

interface ForecastRagCardProps {
  conditions: KayakConditions | null;
  loading?: boolean;
}

const ForecastRagCard: React.FC<ForecastRagCardProps> = ({
  conditions,
  loading,
}) => {
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
              {conditions.reasons && conditions.reasons.length > 0 && (
                <Typography
                  variant="body1"
                  sx={{ color: noPaddlingStatusInfo.color }}
                >
                  ({conditions.reasons.join(", ")})
                </Typography>
              )}
            </Box>
          ) : (
            <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
              <TrafficLight status={conditions.overallStatus} />
            </Box>
          )}

          {conditions.reasons &&
            conditions.reasons.length > 0 &&
            !isNoPaddling && (
              <Box sx={{ mt: 3, textAlign: "center" }}>
                <Typography variant="subtitle1" gutterBottom>
                  Forecast Reasons
                </Typography>
                {conditions.reasons.map((reason, index) => (
                  <Typography variant="body2" key={index}>
                    {reason}
                  </Typography>
                ))}
              </Box>
            )}
        </>
      );
    }
    return (
      <Typography variant="body1" sx={{ mt: 1, textAlign: "center" }}>
        Not enough data to forecast.
      </Typography>
    );
  };

  return (
    <Card variant="outlined" sx={{ width: "100%", p: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Paddling Forecast (next 24 hours)
        </Typography>
        {renderContent()}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "center", mt: 2 }}
        >
          This is an experimental forecast based on current trends and may not
          be accurate.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ForecastRagCard;

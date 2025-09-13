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
          {isNoPaddling && NoPaddlingIcon && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
                p: 2,
                borderRadius: 1,
                backgroundColor: noPaddlingStatusInfo.backgroundColor,
                border: `2px solid ${noPaddlingStatusInfo.color}`,
              }}
            >
              <NoPaddlingIcon
                sx={{ fontSize: 40, color: noPaddlingStatusInfo.color, mb: 1 }}
              />
              <Typography
                variant="h6"
                sx={{ color: noPaddlingStatusInfo.color }}
              >
                No Paddling
              </Typography>
            </Box>
          )}
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
            <TrafficLight
              status={conditions.overallStatus}
              disabled={isNoPaddling}
            />
          </Box>
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
    <Card variant="outlined" sx={{ width: "100%", p: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          RAG Status
        </Typography>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default StatusCard;

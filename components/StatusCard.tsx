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
                border: `2px solid ${noPaddlingStatusInfo.color}`,
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
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 2,
                  mt: 2,
                }}
              >
                {conditions.reasons.map((reason, index) => {
                  const Icon = reasonIcons[reason];
                  return (
                    <Paper
                      key={index}
                      variant="outlined"
                      sx={{
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        height: "100%",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          color: "text.secondary",
                        }}
                      >
                        {Icon && <Icon sx={{ mr: 0.5 }} />}
                        <Typography
                          variant="subtitle2"
                          sx={{ ml: 0.5, textAlign: "center" }}
                        >
                          {reason}
                        </Typography>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            )}
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

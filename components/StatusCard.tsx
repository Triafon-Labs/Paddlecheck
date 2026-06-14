"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import { KayakConditions } from "@/types";
import TrafficLight from "./TrafficLight";
import { ragStatus, reasonIcons } from "@/lib/rag";
import { ConditionsBriefingPaper, ConditionsBriefingAlert } from "./ConditionsBriefing";

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
            <Table size="small" sx={{ mt: 2 }}>
              <TableBody>
                {conditions.reasons.map((reason, index) => {
                  const Icon = reasonIcons[reason];
                  return (
                    <TableRow key={index}>
                      <TableCell sx={{ width: 32, pl: 0, color: "text.secondary" }}>
                        {Icon && <Icon fontSize="small" />}
                      </TableCell>
                      <TableCell sx={{ pr: 0 }}>
                        <Typography variant="body2">{reason}</Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <ConditionsBriefingPaper conditions={conditions} />
          <ConditionsBriefingAlert conditions={conditions} />
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
